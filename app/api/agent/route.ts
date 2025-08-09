import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@supabase/supabase-js'

// helper: create service client (server-side only)
function getServiceClient() {
  const url = process.env.SUPABASE_URL as string
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!url || !key) throw new Error('Supabase Service Role not configured')
  return createClient(url, key)
}

async function resolveOwner(req: NextRequest) {
  const supa = getServiceClient()
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length)
    const { data, error } = await supa.auth.getUser(token)
    if (!error && data.user?.id) return data.user.id
  }
  const device = req.headers.get('x-device-id')
  return device ?? 'web-guest'
}

// Load memory for owner
async function loadMemory(owner: string) {
  const supa = getServiceClient()
  const { data, error } = await supa
    .from('memory_entries')
    .select('id, title, content, importance, tags, updated_at')
    .eq('owner_key', owner)
    .order('importance', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

// Save memory entries
async function saveMemory(owner: string, items: any[]) {
  if (!items?.length) return
  const supa = getServiceClient()
  const rows = items.map((p) => ({
    owner_key: owner,
    title: String(p.title ?? '').slice(0, 200) || 'Note',
    content: p.content ? String(p.content).slice(0, 1000) : null,
    importance: Math.max(1, Math.min(5, Number(p.importance ?? 1))),
    tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
  }))
  await supa.from('memory_entries').insert(rows)
}

// Extract fenced JSON block
function extractJsonBlock(text: string): any | null {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

// A tiny local fallback if no key or error
function localAgent(history: { role: 'user' | 'assistant'; text: string }[], taskContext: any, memories: any[]) {
  const last = history.filter((m) => m.role === 'user').slice(-1)[0]?.text?.toLowerCase() ?? ''
  // detect "remember that ..." to store memory
  const mem = last.match(/\bremember that\b(.+)/i)
  if (mem) {
    const content = mem[1].trim()
    const memory = { title: content.slice(0, 60), content, importance: 3, tags: ['note'] }
    const payload = { actions: [], memory_to_save: [memory] }
    return `Okay, I'll remember that.\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``
  }
  if (/today|complete today|what can i complete/.test(last)) {
    const tasks = Array.isArray(taskContext?.tasks) ? taskContext.tasks : []
    const recs = tasks
      .filter((t: any) => (t.status ?? 'todo') !== 'done')
      .filter((t: any) => (t.difficulty ?? 'easy') === 'easy')
      .slice(0, 5)
      .map((t: any) => ({ id: t.id, title: t.title }))
    const payload = { actions: [{ type: 'set_filter', view: 'today' }], recommendations: recs }
    return `Here are a few quick wins for today.\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``
  }
  return `Got it. Tell me what to add, update, delete, or show (e.g., "Add task: Pay bills on Friday").`
}

export async function POST(req: NextRequest) {
  try {
    const { history = [], taskContext = {} } = await req.json()
    const owner = await resolveOwner(req)
    const mem = await loadMemory(owner)

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    const memoryContext = mem
      .slice(0, 30)
      .map((m) => `- (${m.importance}) ${m.title}${m.content ? ': ' + m.content : ''}${m.tags?.length ? ' [tags: ' + m.tags.join(',') + ']' : ''}`)
      .join('\n')

    const system = `
You are SmartTask Agent. You manage tasks and lightweight "memory" about the user.

Always reply with:
1) A brief helpful reply (2-4 sentences or ~5 bullets).
2) A fenced JSON code block with:
{
  "actions": [...],               // add/update/complete/delete/set_filter
  "recommendations": [...?],      // optional quick wins for Smart tab
  "memory_to_save": [...?]        // optional new memory items to store
}

Guidelines:
- Use memory to avoid duplicate tasks or conflicts with preferences.
- Only save memory if it seems important or recurring (preferences, constraints, recurring routines).
- Example memory item: { "title": "prefers morning workouts", "content": "User tends to schedule workouts before 10am", "importance": 4, "tags": ["preference","health"] }.
- Before suggesting 'add' actions, check memory for duplicates; if a duplicate exists, prefer an 'update' or skip.
- Keep action fields compact and normalized (dates in YYYY-MM-DD, tags lowercase).
`.trim()

    // Build conversation text
    const userText = history.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
    const contextBlob = `Tasks JSON: ${JSON.stringify(taskContext).slice(0, 12000)}\n\nTop Memory:\n${memoryContext}`

    if (!apiKey) {
      const text = localAgent(history, taskContext, mem)
      // parse and store memory if present
      const parsed = extractJsonBlock(text)
      if (parsed?.memory_to_save?.length) await saveMemory(owner, parsed.memory_to_save)
      return NextResponse.json({ text })
    }

    // AI path via AI SDK with Google provider [^3]
    const { text } = await generateText({
      model: google('gemini-2.5-flash', { apiKey }),
      system,
      prompt: `${contextBlob}\n\nConversation:\n${userText}\n\nAssistant:`,
      maxTokens: 900,
    })

    // Persist memory_to_save if provided
    const parsed = extractJsonBlock(text)
    if (parsed?.memory_to_save?.length) await saveMemory(owner, parsed.memory_to_save)

    return NextResponse.json({ text })
  } catch (e: any) {
    // Fallback with a safe, actionable reply
    const safeText =
      'I ran into an issue but here is a suggestion:\n- Focus on 2 quick wins today.\n```json\n' +
      JSON.stringify({ actions: [{ type: 'set_filter', view: 'today' }] }, null, 2) +
      '\n```'
    return NextResponse.json({ text: safeText }, { status: 200 })
  }
}

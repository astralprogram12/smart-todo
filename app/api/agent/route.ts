import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@supabase/supabase-js'

// helper: create service client (server-side only)
function getServiceClient() {
  const url = process.env.SUPABASE_URL as string
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!url || !key) throw new Error('Supabase Service Role not configured')
  // Use the service key to create a client that can bypass RLS
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// MODIFIED: This function now ONLY resolves authenticated users.
// It returns a user ID (UUID) on success, or null on failure.
async function resolveAuthenticatedUser(req: NextRequest): Promise<string | null> {
  const supa = getServiceClient()
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length)
    // Use the service client to validate the user's token
    const { data, error } = await supa.auth.getUser(token)
    if (!error && data.user?.id) {
      return data.user.id // Success: return the UUID
    }
  }
  // Failure: no valid token found
  return null
}

// MODIFIED: Load memory for a specific user ID.
async function loadMemory(userId: string) {
  const supa = getServiceClient()
  const { data, error } = await supa
    .from('memory_entries')
    .select('id, title, content, importance, tags, updated_at')
    // CHANGED: Use 'user_id' instead of 'owner_key'
    .eq('user_id', userId)
    .order('importance', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

// MODIFIED: Save memory entries for a specific user ID.
async function saveMemory(userId: string, items: any[]) {
  if (!items?.length) return
  const supa = getServiceClient()
  const rows = items.map((p) => ({
    // CHANGED: Use 'user_id' instead of 'owner_key'
    user_id: userId,
    title: String(p.title ?? '').slice(0, 200) || 'Note',
    content: p.content ? String(p.content).slice(0, 1000) : null,
    importance: Math.max(1, Math.min(5, Number(p.importance ?? 1))),
    tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
  }))
  // This will fail if userId is not a valid UUID, which is what we want.
  await supa.from('memory_entries').insert(rows)
}

// (The extractJsonBlock and localAgent functions can remain the same if needed,
// but localAgent is now less likely to be used since we enforce authentication.)

export async function POST(req: NextRequest) {
  try {
    const { history = [], taskContext = {} } = await req.json()
    
    // MODIFIED: Enforce user authentication.
    const userId = await resolveAuthenticatedUser(req)

    // If no valid user is found, reject the request.
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const mem = await loadMemory(userId)
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    
    if (!apiKey) {
      // Handle missing API key case if necessary
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }

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
  "actions": [...],
  "recommendations": [...?],
  "memory_to_save": [...?]
}

Guidelines:
- Use memory to avoid duplicate tasks or conflicts with preferences.
- Only save memory if it seems important or recurring.
- Before suggesting 'add' actions, check memory for duplicates; if a duplicate exists, prefer an 'update' or skip.
`.trim()

    const userText = history.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
    const contextBlob = `Tasks JSON: ${JSON.stringify(taskContext).slice(0, 12000)}\n\nTop Memory:\n${memoryContext}`

    const { text } = await generateText({
      model: google('gemini-1.5-flash', { apiKey }),
      system,
      prompt: `${contextBlob}\n\nConversation:\n${userText}\n\nAssistant:`,
      maxTokens: 900,
    })

    // Extract JSON from AI response
    const match = text.match(/```json\s*([\s\S]*?)\s*```/i)
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        // Persist memory_to_save if provided
        if (parsed?.memory_to_save?.length) {
          await saveMemory(userId, parsed.memory_to_save)
        }
      } catch (e) {
        console.error("Failed to parse or save memory from AI response", e)
      }
    }

    return NextResponse.json({ text })
  } catch (e: any) {
    console.error("Agent API Error:", e)
    const safeText = 'I ran into an issue processing your request. Please try again.'
    return NextResponse.json({ text: safeText }, { status: 500 })
  }
}

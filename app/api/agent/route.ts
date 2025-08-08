import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

// Lightweight, safe local fallback agent when no API key is configured.
function localAgent(history: { role: "user" | "assistant"; text: string }[], taskContext: any): string {
  const last = history.filter((m) => m.role === "user").slice(-1)[0]?.text?.toLowerCase() ?? ""
  const tasks = Array.isArray(taskContext?.tasks) ? taskContext.tasks : []

  // Simple "add task" parser
  const addMatch = last.match(/add task:\s*(.+)/i)
  if (addMatch) {
    const title = addMatch[1].trim()
    const action = {
      actions: [
        {
          type: "add",
          title,
          notes: "",
          category: "general",
          tags: [],
          difficulty: "easy",
        },
      ],
    }
    return `Added "${title}".\n\n\`\`\`json\n${JSON.stringify(action, null, 2)}\n\`\`\``
  }

  // Recommend quick wins for "today"
  if (last.includes("complete today") || last.includes("today")) {
    const now = new Date()
    const recs = tasks
      .filter((t: any) => (t.status ?? "todo") !== "done")
      .filter((t: any) => (t.difficulty ?? "easy") === "easy")
      .filter((t: any) => {
        if (!t.dueDate) return true
        const d = new Date(t.dueDate)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
      })
      .slice(0, 5)
      .map((t: any) => ({ id: t.id, title: t.title }))
    const payload = { actions: [{ type: "set_filter", view: "today" }], recommendations: recs }
    return `Here are quick wins for today.\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``
  }

  // Default: mirror with a suggestion to clarify.
  return `Got it. Tell me what to add, update, or show (e.g., "Add task: Call mom tomorrow").`
}

export async function POST(req: NextRequest) {
  try {
    const { history = [], taskContext = {} } = await req.json()

    // Prefer server env; do not accept client-provided keys for security.
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      const text = localAgent(history, taskContext)
      return NextResponse.json({ text })
    }

    const system = `You are a task assistant. Always reply with two parts:
1) A brief, helpful natural language reply.
2) A fenced JSON code block with "actions" and optional "recommendations", following this schema:

\`\`\`json
{
  "actions": [
    // Add a task
    { "type": "add", "title": "string", "notes": "string?", "category": "string?", "tags": ["string"]?, "difficulty": "easy|medium|hard", "dueDate": "YYYY-MM-DD"?, "listName": "string?" },

    // Update a task by title or id (if you know it)
    { "type": "update", "match": { "id": "string?" , "title": "string?" }, "patch": { "title?": "string", "notes?": "string", "status?": "todo|done", "category?": "string", "tags?": ["string"], "difficulty?": "easy|medium|hard", "dueDate?": "YYYY-MM-DD", "listName?": "string" } },

    // Complete or delete
    { "type": "complete", "match": { "id?": "string", "title?": "string" } },
    { "type": "delete", "match": { "id?": "string", "title?": "string" } },

    // Set a filter for what to show in Smart tab
    { "type": "set_filter", "view": "all|today|overdue|week|none", "listName?": "string", "category?": "string", "tag?": "string" }
  ],
  "recommendations": [{ "id?": "string", "title?": "string" }]
}
\`\`\`

Rules:
- Prefer "id" when you referenced an existing task; otherwise use "title" to match.
- Keep titles short.
- If user asks "what can I do today", include a set_filter for "today" and quick wins in "recommendations".
- Use listName exactly as provided in taskContext.lists when grouping.

Only return valid JSON in the fenced block.`

    const userText = history.map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n")

    const { text } = await generateText({
      model: google("gemini-1.5-flash", { apiKey }),
      system,
      prompt: `Context (JSON): ${JSON.stringify(taskContext)}\n\nConversation:\n${userText}\n\nAssistant:`,
    })

    return NextResponse.json({ text })
  } catch (e: any) {
    // Fallback to local agent on any error
    try {
      const body = await req.json().catch(() => ({}))
      const text = localAgent(body.history ?? [], body.taskContext ?? {})
      return NextResponse.json({ text })
    } catch {
      return NextResponse.json({ text: "Something went wrong, please try again." })
    }
  }
}

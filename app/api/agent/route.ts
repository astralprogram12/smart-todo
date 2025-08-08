import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { localPlan } from "@/lib/commands"

// Always return JSON: { text: string }.
// The text MUST include a fenced ```json block with { actions: [...], recommendations?: [...] }.
// Client will parse and apply actions and recommendations.

export async function POST(req: NextRequest) {
  try {
    const { history, taskContext } = await req.json()

    const headerKey = req.headers.get("x-gemini-key") || undefined
    const envKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    const useKey = headerKey || envKey

    const system = `
You are SmartTask Chat, a task management agent.
You ALWAYS reply with:
1) A brief helpful response (2-4 sentences or up to 5 short bullets).
2) Then a fenced JSON code block with EXACT shape:
\`\`\`json
{ "actions": [ 
  { "type": "add_task", "title": "string", "notes":"string?", "dueDate":"YYYY-MM-DD?", "priority":"low|medium|high?", "difficulty":"easy|medium|hard?", "category":"string?", "tags":["slug",... ]?, "listName":"string?" },
  { "type": "update_task", "id":"string?", "titleMatch":"string?", "patch": { "title?": "string", "notes?":"string", "dueDate?":"YYYY-MM-DD", "priority?":"low|medium|high", "difficulty?":"easy|medium|hard", "category?":"string", "tags?": ["slug",...], "listName?":"string", "status?":"todo|doing|done" } },
  { "type": "complete_task", "id":"string?", "titleMatch":"string?", "done": true },
  { "type": "delete_task", "id":"string?", "titleMatch":"string?" },
  { "type": "set_filter", "view":"all|today|overdue|week|none", "listName":"string?", "category":"string?", "tag":"string?" }
], "recommendations": [{ "id?": "string", "title?": "string" }] }
\`\`\`
Guidelines:
- Always include the JSON block, even if actions is [].
- For new tasks, propose difficulty, priority, category, tags (lowercase slugs), and listName. Use YYYY-MM-DD for dates.
- Prefer task ids from the provided Task Context; otherwise use titleMatch/title.
- If asked "what can I complete today", focus on easy/quick tasks due today/overdue and set filter accordingly.
`.trim()

    const historyText = (Array.isArray(history) ? history : [])
      .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n")

    const contextText = taskContext ? `Task Context JSON:\n${JSON.stringify(taskContext).slice(0, 8000)}` : ""

    if (!useKey) {
      const { text, actions } = localPlan(
        // adapt localPlan input signature:
        (Array.isArray(history) ? history : []).map((m: any) => ({
          role: m.role,
          parts: [{ type: "text", text: m.text }],
        })),
        taskContext
      )
      const reply =
        `${text}\n\n` +
        "```json\n" +
        JSON.stringify({ actions }, null, 2) +
        "\n```"
      return NextResponse.json({ text: reply })
    }

    // AI path with Gemini via AI SDK generateText [^2]
    const { text } = await generateText({
      model: google("gemini-2.5-flash", { apiKey: useKey }),
      system,
      prompt: `${contextText}\n\nConversation:\n${historyText}\n\nAssistant:`,
      maxTokens: 900,
    })

    return NextResponse.json({ text })
  } catch (e) {
    // return a safe error with a simple local fallback
    const safeText =
      "I encountered an issue, but here's a suggestion:\n" +
      "- Try 2-3 quick tasks due today.\n" +
      "```json\n" +
      JSON.stringify({ actions: [{ type: "set_filter", view: "today" }] }, null, 2) +
      "\n```"
    return NextResponse.json({ text: safeText }, { status: 200 })
  }
}

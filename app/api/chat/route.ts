import { NextRequest } from "next/server"
import { streamText, UIMessage, convertToModelMessages } from "ai"
import { google } from "@ai-sdk/google"
import { localPlan } from "@/lib/commands"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { messages, taskContext }: { messages: UIMessage[]; taskContext?: any } = body

  const system = `
You are SmartTask Chat, an assistant that manages a user's to-do list via chat.
You MUST always answer in two parts:
1) A brief, helpful response (max 5 short bullet points or 2-4 sentences).
2) A fenced JSON code block with the exact shape:
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
- Always include the JSON actions block (array can be empty).
- Prefer referencing tasks by "id" from the Task Context; otherwise include "titleMatch" or "title" in recommendations.
- If user asks "what can I complete today", pick easy or quick tasks due today/overdue.
  `.trim()

  const headerKey = req.headers.get("x-gemini-key") || undefined
  const envKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const useKey = headerKey || envKey

  if (!useKey) {
    // Local fallback
    const { text, actions } = localPlan(messages, taskContext)
    return new Response(
      JSON.stringify({
        type: "message",
        id: "local-fallback",
        role: "assistant",
        parts: [
          {
            type: "text",
            text:
              text.trim() +
              "\n\n```json\n" +
              JSON.stringify({ actions }, null, 2) +
              "\n```",
          },
        ],
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  }

  const result = streamText({
    model: google("gemini-2.5-flash", { apiKey: useKey }),
    messages: convertToModelMessages(messages),
    system,
    maxTokens: 900,
    inputFormat: "messages",
    prompt: taskContext
      ? `Task Context JSON:\n${JSON.stringify(taskContext).slice(0, 8000)}\n\nUse this context to reference ids/titles.`
      : undefined,
  })

  return result.toUIStreamResponse()
}

export type CommandAction =
  | { type: "add_task"; title: string; notes?: string; dueDate?: string; priority?: "low" | "medium" | "high"; difficulty?: "easy" | "medium" | "hard"; category?: string; tags?: string[]; listName?: string }
  | { type: "update_task"; id?: string; titleMatch?: string; patch: Record<string, any> }
  | { type: "complete_task"; id?: string; titleMatch?: string; done?: boolean }
  | { type: "delete_task"; id?: string; titleMatch?: string }
  | { type: "set_filter"; view?: "all" | "today" | "overdue" | "week" | "none"; listName?: string; category?: string; tag?: string }

export function parseActionsFromAssistant(text: string): CommandAction[] {
  const match = text.match(/```json([\s\S]*?)```/i)
  if (!match) return []
  try {
    const obj = JSON.parse(match[1].trim())
    const arr = Array.isArray(obj?.actions) ? obj.actions : []
    return arr.filter((a) => a && typeof a.type === "string")
  } catch {
    return []
  }
}

// Local fallback planner used when no API key is configured
export function localPlan(messages: any[], taskContext?: any): { text: string; actions: CommandAction[] } {
  const lastUser = [...messages].reverse().find((m) => m?.role === "user")
  const userText: string = lastUser?.content?.map?.((p: any) => (p.type === "text" ? p.text : "")).join("\n") ?? ""

  const now = new Date()
  const tasks = taskContext?.tasks ?? []
  const easyToday = tasks
    .filter((t: any) => t.status !== "done")
    .filter((t: any) => {
      const due = t.dueDate ? new Date(t.dueDate) : null
      const isDueToday =
        due &&
        due.getFullYear() === now.getFullYear() &&
        due.getMonth() === now.getMonth() &&
        due.getDate() === now.getDate()
      const isOverdue = due && due < now
      return (isDueToday || isOverdue) && (t.difficulty === "easy" || (t.tags ?? []).includes("quick"))
    })
    .slice(0, 5)

  let text = "- Here's a focused list for you:\n"
  if (easyToday.length === 0) {
    text += "- No obvious quick wins. Consider adding due dates or marking priorities."
  } else {
    for (const t of easyToday) text += `- ${t.title}\n`
  }

  // Very basic intent: if user says "add task:" create naive add
  const addMatch = userText.match(/add task\s*:\s*(.+)/i)
  const actions: CommandAction[] = []
  if (addMatch) {
    actions.push({
      type: "add_task",
      title: addMatch[1].trim(),
      difficulty: "easy",
      priority: "medium",
      listName: "General",
      tags: ["quick"],
    })
  } else if (/what can i complete today/i.test(userText)) {
    // No state changes, just keep current filter to 'today'
    actions.push({ type: "set_filter", view: "today" })
  }

  return { text, actions }
}

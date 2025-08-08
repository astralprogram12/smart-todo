export function heuristicClassify({ title, description }: { title: string; description: string }) {
  const text = `${title} ${description}`.toLowerCase()
  const includes = (arr: string[]) => arr.some((w) => text.includes(w))
  let category: string = "Personal"
  if (includes(["report", "meeting", "client", "deck", "ppt", "okrs", "status", "invoice"])) category = "Work"
  else if (includes(["gym", "run", "doctor", "meditation", "yoga"])) category = "Health"
  else if (includes(["pay", "budget", "tax", "invoice", "receipt"])) category = "Finance"
  else if (includes(["grocery", "buy", "pickup", "order", "returns"])) category = "Errands"
  else if (includes(["clean", "laundry", "dishes", "repair", "move"])) category = "Home"
  else if (includes(["read", "course", "learn", "study", "tutorial"])) category = "Learning"

  let difficulty: "easy" | "medium" | "hard" = "medium"
  if (includes(["email", "call", "book", "schedule", "draft", "note"])) difficulty = "easy"
  if (includes(["research", "implement", "debug", "migrate"])) difficulty = "hard"

  const tags: string[] = []
  if (includes(["today", "urgent", "asap"])) tags.push("urgent")
  if (includes(["quick", "5 min", "5min", "short", "fast", "call", "email"])) tags.push("quick")
  if (includes(["deep", "focus", "write", "long"])) tags.push("deep-work")
  if (includes(["home", "kitchen", "bedroom"])) tags.push("home")
  if (includes(["work", "client", "status"])) tags.push("work")
  if (includes(["health", "gym", "run"])) tags.push("health")
  if (includes(["learn", "course", "tutorial"])) tags.push("learning")

  let listName = "General"
  if (includes(["move", "apartment", "boxes"])) listName = "Move Apartment"
  else if (includes(["grocery", "buy", "order"])) listName = "Groceries"
  else if (includes(["tax", "budget", "invoice"])) listName = "Finance"
  else if (includes(["okrs", "status", "report"])) listName = "Work"

  return { category, difficulty, tags: Array.from(new Set(tags)), listName }
}

export function localRecommend(tasks: any[], strategy: string) {
  const now = new Date()
  if (strategy === "today-easy") {
    return tasks
      .filter((t: any) => t.status !== "done")
      .filter((t: any) => {
        if (!t.dueDate) return false
        const due = new Date(t.dueDate)
        const isDueToday =
          due.getFullYear() === now.getFullYear() &&
          due.getMonth() === now.getMonth() &&
          due.getDate() === now.getDate()
        const isOverdue = due < now
        return (isDueToday || isOverdue) && (t.difficulty === "easy" || (t.tags ?? []).includes("quick"))
      })
      .slice(0, 6)
  }
  return tasks.slice(0, 6)
}

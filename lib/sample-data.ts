import { type Task, type TaskList } from "@/components/task-context"
import { v4 as uuid } from "uuid"

export function seedLists(): TaskList[] {
  return [
    { id: uuid(), name: "General", color: "#7c3aed" },
    { id: uuid(), name: "Work", color: "#14b8a6" },
    { id: uuid(), name: "Groceries", color: "#f59e0b" },
  ]
}

export function seedTasks(): Task[] {
  const lists = seedLists()
  const byName = Object.fromEntries(lists.map((l) => [l.name, l.id]))
  const now = new Date()
  const today = new Date(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  return [
    {
      id: uuid(),
      title: "Email client about project timeline",
      notes: "Keep it concise. Ask for confirmation.",
      dueDate: fmt(today),
      priority: "medium",
      difficulty: "easy",
      category: "Work",
      tags: ["quick", "work"],
      listId: byName["Work"],
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      title: "Grocery run: veggies, milk, coffee beans",
      notes: "",
      dueDate: fmt(tomorrow),
      priority: "low",
      difficulty: "easy",
      category: "Errands",
      tags: ["quick", "home"],
      listId: byName["Groceries"],
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      title: "Write weekly status report",
      notes: "Summarize the sprint progress and blockers.",
      dueDate: fmt(tomorrow),
      priority: "high",
      difficulty: "medium",
      category: "Work",
      tags: ["deep-work"],
      listId: byName["Work"],
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      title: "30-min yoga session",
      notes: "Focus on breathing.",
      dueDate: undefined,
      priority: "low",
      difficulty: "easy",
      category: "Health",
      tags: ["health"],
      listId: byName["General"],
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      title: "Research TypeScript decorators",
      notes: "Collect examples and trade-offs.",
      dueDate: undefined,
      priority: "medium",
      difficulty: "hard",
      category: "Learning",
      tags: ["learning", "deep-work"],
      listId: byName["General"],
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

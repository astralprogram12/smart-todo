import type { Task, TaskList } from "@/components/task-context"

function parseRepeatFromTags(tags: string[] | null | undefined): {
  repeat?: Task["repeat"]
  repeatEveryDays?: number
} {
  if (!tags) return {}
  if (tags.includes("repeat:daily")) return { repeat: "daily", repeatEveryDays: 1 }
  if (tags.includes("repeat:weekly")) return { repeat: "weekly", repeatEveryDays: 7 }
  const custom = (tags.find((t) => t.startsWith("repeat:every:")) ?? "").split(":")
  // formats: repeat:every:days:3 or repeat:every:weeks:2
  if (custom.length === 4 && custom[0] === "repeat" && custom[1] === "every") {
    const unit = custom[2]
    const n = Number(custom[3])
    if (Number.isFinite(n) && n > 0) {
      const days = unit === "weeks" ? n * 7 : n
      return { repeat: "custom", repeatEveryDays: days }
    }
  }
  return {}
}

function withoutRepeatTags(tags: string[] | null | undefined) {
  return (tags ?? []).filter((t) => !t.startsWith("repeat:"))
}

function toRepeatTag(t: Pick<Task, "repeat" | "repeatEveryDays">): string | null {
  if (!t.repeat) return null
  if (t.repeat === "daily") return "repeat:daily"
  if (t.repeat === "weekly") return "repeat:weekly"
  if (t.repeat === "custom") {
    const n = Math.max(1, Number(t.repeatEveryDays ?? 1))
    return `repeat:every:days:${n}`
  }
  return null
}

export type DbTask = {
  id: string
  device_id: string
  title: string
  notes: string | null
  due_date: string | null // YYYY-MM-DD
  priority: "low" | "medium" | "high" | null
  difficulty: "easy" | "medium" | "hard" | null
  category: string | null
  tags: string[] | null
  list_id: string | null
  status: "todo" | "doing" | "done"
  created_at: string
  updated_at: string
}

export type DbList = {
  id: string
  device_id: string
  name: string
  color: string | null
  created_at: string
}

export function fromDbTask(row: DbTask): Task {
  const { repeat, repeatEveryDays } = parseRepeatFromTags(row.tags)
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || "",
    dueDate: row.due_date || undefined,
    priority: (row.priority || undefined) as Task["priority"],
    difficulty: row.difficulty || "medium",
    category: row.category || "Personal",
    tags: row.tags || [],
    repeat,
    repeatEveryDays,
    listId: row.list_id || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toDbTask(deviceId: string, t: Task): DbTask {
  const clean = withoutRepeatTags(t.tags)
  const rtag = toRepeatTag(t)
  const tags = rtag ? Array.from(new Set([...clean, rtag])) : clean
  return {
    id: t.id,
    device_id: deviceId,
    title: t.title,
    notes: t.notes ?? null,
    due_date: t.dueDate ?? null,
    priority: (t.priority ?? "medium") as any,
    difficulty: t.difficulty,
    category: t.category,
    tags,
    list_id: t.listId ?? null,
    status: t.status,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }
}

export function fromDbList(row: DbList): TaskList {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? undefined,
  }
}

import type { Task, TaskList } from "@/components/task-context"

// --- Helper functions for repeat tags (Unchanged) ---
function parseRepeatFromTags(tags: string[] | null | undefined): {
  repeat?: Task["repeat"]
  repeatEveryDays?: number
} {
  if (!tags) return {}
  if (tags.includes("repeat:daily")) return { repeat: "daily", repeatEveryDays: 1 }
  if (tags.includes("repeat:weekly")) return { repeat: "weekly", repeatEveryDays: 7 }
  const custom = (tags.find((t) => t.startsWith("repeat:every:")) ?? "").split(":")
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

// --- MODIFIED Database Type Definitions ---

// This now includes our new schema with a nullable user_id and device_id.
export type DbTask = {
  id: string
  user_id: string | null // Can be null for anonymous tasks
  device_id: string | null // Can be null for authenticated user tasks
  title: string
  notes: string | null
  due_date: string | null
  priority: "low" | "medium" | "high" | null
  difficulty: "easy" | "medium" | "hard" | null
  category: string | null
  tags: string[] | null
  list_id: string | null
  status: "todo" | "doing" | "done"
  created_at: string
  updated_at: string
}

// DbList remains the same for now, as we haven't modified that table yet.
export type DbList = {
  id: string
  device_id: string
  name: string
  color: string | null
  created_at: string
}


// --- MODIFIED Data Transformation Functions ---

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

// THIS IS THE MOST IMPORTANT CHANGE
export function toDbTask(scopeId: string, t: Task, source: "local" | "supabase"): Partial<DbTask> {
  const clean = withoutRepeatTags(t.tags)
  const rtag = toRepeatTag(t)
  const tags = rtag ? Array.from(new Set([...clean, rtag])) : clean
  
  // Base object with common fields
  const baseTask = {
    id: t.id,
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

  // Conditionally add user_id or device_id based on the source
  if (source === 'supabase') {
    // If user is authenticated, scopeId is the userId
    return { ...baseTask, user_id: scopeId, device_id: null }
  } else {
    // If user is anonymous, scopeId is the deviceId
    return { ...baseTask, user_id: null, device_id: scopeId }
  }
}

// fromDbList remains unchanged.
export function fromDbList(row: DbList): TaskList {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? undefined,
  }
}

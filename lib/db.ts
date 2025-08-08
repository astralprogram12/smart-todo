import { type Task, type TaskList } from "@/components/task-context"

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
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || "",
    dueDate: row.due_date || undefined,
    priority: (row.priority || undefined) as Task["priority"],
    difficulty: (row.difficulty || "medium"),
    category: row.category || "Personal",
    tags: row.tags || [],
    listId: row.list_id || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toDbTask(deviceId: string, t: Task): DbTask {
  return {
    id: t.id,
    device_id: deviceId,
    title: t.title,
    notes: t.notes ?? null,
    due_date: t.dueDate ?? null,
    priority: (t.priority ?? "medium") as any,
    difficulty: t.difficulty,
    category: t.category,
    tags: t.tags,
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

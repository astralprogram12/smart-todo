"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { v4 as uuid } from "uuid"
import { heuristicClassify } from "@/lib/auto-tag"

export type Difficulty = "easy" | "medium" | "hard"
export type Status = "todo" | "doing" | "done"

export type Task = {
  id: string
  title: string
  notes?: string
  dueDate?: string
  priority?: "low" | "medium" | "high"
  difficulty: Difficulty
  category: string
  tags: string[]
  listId?: string
  status: Status
  createdAt: string
  updatedAt: string
}

export type TaskList = {
  id: string
  name: string
  color?: string
}

type Filters = {
  view?: "all" | "today" | "overdue" | "week" | "none"
  listId?: string
  category?: string
  tag?: string
}

type Action =
  | { type: "add_task"; title: string; notes?: string; dueDate?: string; priority?: "low" | "medium" | "high"; difficulty?: Difficulty; category?: string; tags?: string[]; listName?: string }
  | { type: "update_task"; id?: string; titleMatch?: string; patch: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">> & { listName?: string } }
  | { type: "complete_task"; id?: string; titleMatch?: string; done?: boolean }
  | { type: "delete_task"; id?: string; titleMatch?: string }
  | { type: "set_filter"; view?: Filters["view"]; listName?: string; category?: string; tag?: string }

type Ctx = {
  tasks: Task[]
  lists: TaskList[]
  filters: Filters
  setFilters: (f: Filters) => void
  addList: (name: string) => string
  getListName: (id?: string) => string
  toggleDone: (id: string) => void
  deleteTask: (id: string) => void
  applyActions: (actions: Action[]) => void
  exportSnapshot: () => { tasks: Task[]; lists: TaskList[]; filters: Filters }
}

const TaskCtx = createContext<Ctx | null>(null)

const TASKS_KEY = "chat_smart_tasks_v1"
const LISTS_KEY = "chat_smart_lists_v1"
const FILTERS_KEY = "chat_smart_filters_v1"

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<TaskList[]>([])
  const [filters, setFilters] = useState<Filters>({ view: "all" })

  useEffect(() => {
    const tRaw = localStorage.getItem(TASKS_KEY)
    const lRaw = localStorage.getItem(LISTS_KEY)
    const fRaw = localStorage.getItem(FILTERS_KEY)
    setTasks(tRaw ? JSON.parse(tRaw) : [])
    setLists(
      lRaw
        ? JSON.parse(lRaw)
        : [
            { id: uuid(), name: "General", color: "#7c3aed" },
            { id: uuid(), name: "Work", color: "#14b8a6" },
            { id: uuid(), name: "Groceries", color: "#f59e0b" },
          ]
    )
    setFilters(fRaw ? JSON.parse(fRaw) : { view: "all" })
  }, [])

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
  }, [lists])

  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
  }, [filters])

  const addList = useCallback((name: string) => {
    const existing = lists.find((l) => l.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing.id
    const id = uuid()
    const color = pickColor(name)
    setLists((prev) => [...prev, { id, name, color }])
    return id
  }, [lists])

  const getListName = useCallback((id?: string) => {
    if (!id) return "No List"
    return lists.find((l) => l.id === id)?.name ?? "Unknown"
  }, [lists])

  const toggleDone = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "todo" : "done", updatedAt: new Date().toISOString() }
          : t
      )
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addTask = useCallback((payload: {
    title: string; notes?: string; dueDate?: string; priority?: "low" | "medium" | "high";
    difficulty?: Difficulty; category?: string; tags?: string[]; listName?: string
  }) => {
    const now = new Date().toISOString()
    // Heuristic enrichment if missing
    const h = heuristicClassify({ title: payload.title, description: payload.notes ?? "" })
    const listId = payload.listName ? addList(payload.listName) : addList(h.listName)
    setTasks((prev) => [
      {
        id: uuid(),
        title: payload.title,
        notes: payload.notes ?? "",
        dueDate: payload.dueDate,
        priority: payload.priority ?? "medium",
        difficulty: payload.difficulty ?? h.difficulty,
        category: payload.category ?? h.category,
        tags: payload.tags && payload.tags.length ? payload.tags : h.tags,
        listId,
        status: "todo",
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ])
  }, [addList])

  const applyActions = useCallback((actions: Action[]) => {
    if (!actions || actions.length === 0) return

    function findByIdOrTitle(a: { id?: string; titleMatch?: string }) {
      if (a.id) return tasks.find((t) => t.id === a.id)
      if (a.titleMatch) {
        const lower = a.titleMatch.toLowerCase().trim()
        return tasks.find((t) => t.title.toLowerCase().trim() === lower) ?? tasks.find((t) => t.title.toLowerCase().includes(lower))
      }
      return undefined
    }

    for (const a of actions) {
      if (a.type === "add_task") {
        addTask(a)
      } else if (a.type === "complete_task") {
        const t = findByIdOrTitle(a)
        if (t) {
          const done = a.done ?? true
          toggleDone(t.id)
          // If they want explicitly undone, toggle only if states mismatch
          if (!done) toggleDone(t.id)
        }
      } else if (a.type === "delete_task") {
        const t = findByIdOrTitle(a)
        if (t) deleteTask(t.id)
      } else if (a.type === "update_task") {
        const t = findByIdOrTitle(a)
        if (t) {
          setTasks((prev) =>
            prev.map((x) => {
              if (x.id !== t.id) return x
              let next = { ...x, ...a.patch, updatedAt: new Date().toISOString() }
              if ((a.patch as any)?.listName) {
                const newListId = addList((a.patch as any).listName as string)
                next.listId = newListId
                // remove listName transient field
                const { listName, ...rest } = a.patch as any
                next = { ...next, ...rest }
              }
              return next
            })
          )
        }
      } else if (a.type === "set_filter") {
        const next = { ...filters }
        if (a.view) next.view = a.view
        if (a.category) next.category = a.category
        if (a.tag) next.tag = a.tag
        if (a.listName) {
          const id = addList(a.listName)
          next.listId = id
        }
        setFilters(next)
      }
    }
  }, [tasks, filters, addTask, toggleDone, deleteTask, setFilters, addList])

  const exportSnapshot = useCallback(() => ({ tasks, lists, filters }), [tasks, lists, filters])

  const value: Ctx = {
    tasks,
    lists,
    filters,
    setFilters,
    addList,
    getListName,
    toggleDone,
    deleteTask,
    applyActions,
    exportSnapshot,
  }

  return <TaskCtx.Provider value={value}>{children}</TaskCtx.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskCtx)
  if (!ctx) throw new Error("useTasks must be used within TaskProvider")
  return ctx
}

function pickColor(name: string) {
  const palette = ["#7c3aed", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"]
  let sum = 0
  for (const ch of name) sum += ch.charCodeAt(0)
  return palette[sum % palette.length]
}

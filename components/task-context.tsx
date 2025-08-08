"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { v4 as uuid } from "uuid"
import { heuristicClassify } from "@/lib/auto-tag"
import { getSupabaseClient } from "@/lib/supabase/client"
import { fromDbList, fromDbTask, toDbTask } from "@/lib/db"

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
  source: "local" | "supabase"
  scopeId: string
  tasks: Task[]
  lists: TaskList[]
  filters: Filters
  setFilters: (f: Filters) => void
  addList: (name: string) => Promise<string>
  getListName: (id?: string) => string
  toggleDone: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  applyActions: (actions: Action[]) => void
  exportSnapshot: () => { tasks: Task[]; lists: TaskList[]; filters: Filters }
  smartResults: string[]
  setSmartResults: (ids: string[]) => void
}

const TaskCtx = createContext<Ctx | null>(null)

const TASKS_KEY = "chat_smart_tasks_v1"
const LISTS_KEY = "chat_smart_lists_v1"
const FILTERS_KEY = "chat_smart_filters_v1"
const SMART_KEY = "chat_smart_results_v1"
const DEVICE_KEY = "chat_smart_device_id"

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient()
  const source: "local" | "supabase" = supabase ? "supabase" : "local"

  const [deviceId, setDeviceId] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [scopeId, setScopeId] = useState<string>("")

  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<TaskList[]>([])
  const [filters, setFilters] = useState<Filters>({ view: "all" })
  const [smartResults, setSmartResultsState] = useState<string[]>([])

  // device id
  useEffect(() => {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = uuid()
      localStorage.setItem(DEVICE_KEY, id)
    }
    setDeviceId(id)
  }, [])

  // listen to auth
  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id ?? "")
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? "")
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  // scope id = userId || deviceId
  useEffect(() => {
    setScopeId(userId || deviceId)
  }, [userId, deviceId])

  // initial load
  useEffect(() => {
    if (!scopeId) return
    if (source === "supabase") {
      ;(async () => {
        // lists
        const { data: lrows } = await supabase!
          .from("lists")
          .select("*")
          .eq("device_id", scopeId)
          .order("created_at", { ascending: true })
        let loadedLists = (lrows ?? []).map(fromDbList)
        if (!loadedLists || loadedLists.length === 0) {
          const defaults = [
            { id: uuid(), device_id: scopeId, name: "General", color: "#888888" },
            { id: uuid(), device_id: scopeId, name: "Work", color: "#cccccc" },
            { id: uuid(), device_id: scopeId, name: "Groceries", color: "#aaaaaa" },
          ]
          await supabase!.from("lists").insert(defaults)
          loadedLists = defaults.map((r) => ({ id: r.id, name: r.name, color: r.color || undefined }))
        }
        setLists(loadedLists)
        // tasks
        const { data: trows } = await supabase!
          .from("tasks")
          .select("*")
          .eq("device_id", scopeId)
          .order("created_at", { ascending: false })
        setTasks((trows ?? []).map(fromDbTask))
        // filters/smart
        const fRaw = localStorage.getItem(FILTERS_KEY)
        const sRaw = localStorage.getItem(SMART_KEY)
        setFilters(fRaw ? JSON.parse(fRaw) : { view: "all" })
        setSmartResultsState(sRaw ? JSON.parse(sRaw) : [])
      })()
    } else {
      // local mode
      const tRaw = localStorage.getItem(TASKS_KEY)
      const lRaw = localStorage.getItem(LISTS_KEY)
      const fRaw = localStorage.getItem(FILTERS_KEY)
      const sRaw = localStorage.getItem(SMART_KEY)
      setTasks(tRaw ? JSON.parse(tRaw) : [])
      setLists(
        lRaw
          ? JSON.parse(lRaw)
          : [
              { id: uuid(), name: "General", color: "#888888" },
              { id: uuid(), name: "Work", color: "#cccccc" },
              { id: uuid(), name: "Groceries", color: "#aaaaaa" },
            ]
      )
      setFilters(fRaw ? JSON.parse(fRaw) : { view: "all" })
      setSmartResultsState(sRaw ? JSON.parse(sRaw) : [])
    }
  }, [source, supabase, scopeId])

  // persist filters and smart results
  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
  }, [filters])
  useEffect(() => {
    localStorage.setItem(SMART_KEY, JSON.stringify(smartResults))
  }, [smartResults])

  // persist tasks/lists in local-only mode
  useEffect(() => {
    if (source === "local") {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
    }
  }, [tasks, source])
  useEffect(() => {
    if (source === "local") {
      localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
    }
  }, [lists, source])

  const addList = useCallback(async (name: string) => {
    const existing = lists.find((l) => l.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing.id
    const id = uuid()
    const newList: TaskList = { id, name, color: undefined }
    setLists((prev) => [...prev, newList])

    if (source === "supabase") {
      await supabase!.from("lists").insert({ id, device_id: scopeId, name, color: null })
    }
    return id
  }, [lists, source, supabase, scopeId])

  const getListName = useCallback((id?: string) => {
    if (!id) return "No List"
    return lists.find((l) => l.id === id)?.name ?? "Unknown"
  }, [lists])

  const toggleDone = useCallback(async (id: string) => {
    const now = new Date().toISOString()
    let newTask: Task | null = null
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const updated = { ...t, status: t.status === "done" ? "todo" : "done", updatedAt: now }
        newTask = updated
        return updated
      })
    )
    if (source === "supabase" && newTask) {
      await supabase!.from("tasks").update({ status: newTask.status, updated_at: now }).eq("id", id).eq("device_id", scopeId)
    }
  }, [source, supabase, scopeId])

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    if (source === "supabase") {
      await supabase!.from("tasks").delete().eq("id", id).eq("device_id", scopeId)
    }
  }, [source, supabase, scopeId])

  const addTask = useCallback(async (payload: {
    title: string; notes?: string; dueDate?: string; priority?: "low" | "medium" | "high";
    difficulty?: Difficulty; category?: string; tags?: string[]; listName?: string
  }) => {
    const now = new Date().toISOString()
    const h = heuristicClassify({ title: payload.title, description: payload.notes ?? "" })
    const listId = await addList(payload.listName ? payload.listName : h.listName)
    const t: Task = {
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
    }
    setTasks((prev) => [t, ...prev])

    if (source === "supabase") {
      const row = toDbTask(scopeId, t)
      await supabase!.from("tasks").insert(row)
    }
  }, [addList, source, supabase, scopeId])

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

    ;(async () => {
      for (const a of actions) {
        if (a.type === "add_task") {
          await addTask(a)
        } else if (a.type === "complete_task") {
          const t = findByIdOrTitle(a)
          if (t) {
            const done = a.done ?? true
            const isDone = t.status === "done"
            if ((done && !isDone) || (!done && isDone)) {
              await toggleDone(t.id)
            }
          }
        } else if (a.type === "delete_task") {
          const t = findByIdOrTitle(a)
          if (t) await deleteTask(t.id)
        } else if (a.type === "update_task") {
          const t = findByIdOrTitle(a)
          if (t) {
            const now = new Date().toISOString()
            let listId = t.listId
            if ((a.patch as any)?.listName) {
              listId = await addList((a.patch as any).listName as string)
            }
            const patchLocal: Partial<Task> = { ...a.patch, listId, updatedAt: now }
            delete (patchLocal as any).listName

            setTasks((prev) =>
              prev.map((x) => (x.id === t.id ? { ...x, ...patchLocal } : x))
            )

            if (source === "supabase") {
              const dbPatch: any = {}
              if (patchLocal.title !== undefined) dbPatch.title = patchLocal.title
              if (patchLocal.notes !== undefined) dbPatch.notes = patchLocal.notes
              if (patchLocal.dueDate !== undefined) dbPatch.due_date = patchLocal.dueDate ?? null
              if (patchLocal.priority !== undefined) dbPatch.priority = patchLocal.priority
              if (patchLocal.difficulty !== undefined) dbPatch.difficulty = patchLocal.difficulty
              if (patchLocal.category !== undefined) dbPatch.category = patchLocal.category
              if (patchLocal.tags !== undefined) dbPatch.tags = patchLocal.tags
              if (patchLocal.listId !== undefined) dbPatch.list_id = patchLocal.listId ?? null
              if (patchLocal.status !== undefined) dbPatch.status = patchLocal.status
              dbPatch.updated_at = now
              await supabase!.from("tasks").update(dbPatch).eq("id", t.id).eq("device_id", scopeId)
            }
          }
        } else if (a.type === "set_filter") {
          const next = { ...filters }
          if (a.view) next.view = a.view
          if (a.category) next.category = a.category
          if (a.tag) next.tag = a.tag
          if (a.listName) {
            const id = await addList(a.listName)
            next.listId = id
          }
          setFilters(next)
        }
      }
    })()
  }, [tasks, filters, addTask, toggleDone, deleteTask, setFilters, addList, source, supabase, scopeId])

  const exportSnapshot = useCallback(() => ({ tasks, lists, filters }), [tasks, lists, filters])

  const setSmartResults = useCallback((ids: string[]) => {
    setSmartResultsState(ids)
  }, [])

  const value: Ctx = useMemo(() => ({
    source,
    scopeId,
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
    smartResults,
    setSmartResults,
  }), [source, scopeId, tasks, lists, filters, addList, getListName, toggleDone, deleteTask, applyActions, exportSnapshot, smartResults, setSmartResults])

  return <TaskCtx.Provider value={value}>{children}</TaskCtx.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskCtx)
  if (!ctx) throw new Error("useTasks must be used within TaskProvider")
  return ctx
}

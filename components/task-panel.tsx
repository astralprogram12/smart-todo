"use client"

import type React from "react"

import { useMemo } from "react"
import { useTasks } from "./task-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Tag, Trash2, ListPlus } from "lucide-react"
import { cn } from "@/lib/utils"

export function TaskPanel() {
  const { tasks, lists, filters, setFilters, toggleDone, deleteTask, getListName } = useTasks()

  const visible = useMemo(() => {
    const now = new Date()
    const weekAhead = new Date()
    weekAhead.setDate(now.getDate() + 7)
    return tasks.filter((t) => {
      if (filters.listId && t.listId !== filters.listId) return false
      if (filters.category && t.category !== filters.category) return false
      if (filters.tag && !t.tags.includes(filters.tag)) return false
      if (filters.view && filters.view !== "all") {
        const due = t.dueDate ? new Date(t.dueDate) : undefined
        if (filters.view === "today") {
          if (!due) return false
          if (
            due.getFullYear() !== now.getFullYear() ||
            due.getMonth() !== now.getMonth() ||
            due.getDate() !== now.getDate()
          )
            return false
        } else if (filters.view === "overdue") {
          if (!due || due >= now) return false
        } else if (filters.view === "week") {
          if (!due || due < now || due > weekAhead) return false
        } else if (filters.view === "none") {
          if (due) return false
        }
      }
      return true
    })
  }, [tasks, filters])

  return (
    <aside className="h-fit rounded-2xl border p-4" style={{ borderColor: "var(--tertiary)", background: "#ffffff" }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "var(--secondary)" }}>
          All Tasks
        </h2>
        <div className="text-xs" style={{ color: "color-mix(in srgb, var(--secondary) 70%, transparent)" }}>
          {visible.length} / {tasks.length} visible
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <FilterChip
          label="All"
          active={!filters.view || filters.view === "all"}
          onClick={() => setFilters({ ...filters, view: "all" })}
        />
        <FilterChip
          label="Today"
          active={filters.view === "today"}
          onClick={() => setFilters({ ...filters, view: "today" })}
        />
        <FilterChip
          label="Overdue"
          active={filters.view === "overdue"}
          onClick={() => setFilters({ ...filters, view: "overdue" })}
        />
        <FilterChip
          label="This week"
          active={filters.view === "week"}
          onClick={() => setFilters({ ...filters, view: "week" })}
        />
      </div>

      <ul className="space-y-2">
        {visible.map((t) => (
          <li
            key={t.id}
            className={cn("group rounded-xl border p-3 transition", t.status === "done" && "opacity-70")}
            style={{ borderColor: "var(--tertiary)", background: "#ffffff" }}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={t.status === "done"}
                onCheckedChange={() => toggleDone(t.id)}
                aria-label={t.status === "done" ? "Mark as todo" : "Mark as done"}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4
                      className={cn("font-medium", t.status === "done" && "line-through opacity-70")}
                      style={{ color: "var(--secondary)" }}
                    >
                      {t.title}
                    </h4>
                    {t.notes && (
                      <p
                        className="mt-0.5 line-clamp-2 text-sm"
                        style={{ color: "color-mix(in srgb, var(--secondary) 70%, transparent)" }}
                      >
                        {t.notes}
                      </p>
                    )}
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                  >
                    {t.difficulty}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {t.dueDate && (
                    <span className="inline-flex items-center gap-1" style={{ color: "var(--secondary)" }}>
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1" style={{ color: "var(--secondary)" }}>
                    <Tag className="h-3.5 w-3.5" />
                    {t.category}
                  </span>
                  <span className="inline-flex items-center gap-1" style={{ color: "var(--secondary)" }}>
                    <Tag className="h-3.5 w-3.5" />
                    {`List: ${getListName(t.listId)}`}
                  </span>
                  {t.tags.slice(0, 3).map((tg) => (
                    <Badge
                      key={tg}
                      variant="secondary"
                      className="border"
                      style={{
                        background: "var(--tertiary-soft)",
                        borderColor: "var(--tertiary)",
                        color: "var(--secondary)",
                      }}
                    >
                      {tg}
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(t.id)}
                    className="ml-auto"
                    style={{ color: "var(--brand)" }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <h3
          className="mb-2 text-xs uppercase tracking-wide"
          style={{ color: "color-mix(in srgb, var(--secondary) 70%, transparent)" }}
        >
          Lists
        </h3>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            icon={<ListPlus className="h-3.5 w-3.5" />}
            label="All Lists"
            active={!filters.listId}
            onClick={() => setFilters({ ...filters, listId: undefined })}
          />
          {lists.map((l) => (
            <FilterChip
              key={l.id}
              label={l.name}
              active={filters.listId === l.id}
              onClick={() => setFilters({ ...filters, listId: l.id })}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}

function FilterChip({
  label,
  onClick,
  active,
  icon,
}: {
  label: string
  onClick: () => void
  active?: boolean
  icon?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
      style={{
        borderColor: active ? "var(--brand)" : "var(--tertiary)",
        background: active ? "var(--brand-soft)" : "#ffffff",
        color: active ? "var(--brand)" : "var(--secondary)",
      }}
    >
      {icon}
      {label}
    </button>
  )
}

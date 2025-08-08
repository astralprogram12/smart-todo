"use client"

import { useMemo } from "react"
import { useTasks } from "./task-context"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Tag } from 'lucide-react'
import { cn } from "@/lib/utils"

export function SmartPanel() {
  const { tasks, smartResults, getListName } = useTasks()

  const visible = useMemo(() => {
    if (!smartResults || smartResults.length === 0) return []
    const map = new Map(tasks.map((t) => [t.id, t]))
    return smartResults
      .map((id: string) => map.get(id))
      .filter(Boolean)
  }, [tasks, smartResults])

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-red-900">Smart Tasks</h2>
        <div className="text-xs text-red-900/70">
          {visible.length > 0 ? `${visible.length} suggested` : "No suggestions yet"}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-red-200 bg-red-50/50 p-4 text-sm text-red-900/70">
          Ask the assistant below to filter or recommend tasks. Example:{" "}
          <em>{"What can I complete today?"}</em>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((t: any) => (
            <li
              key={t.id}
              className={cn(
                "group rounded-xl border border-red-100 bg-white p-3 transition hover:bg-red-50",
                t.status === "done" && "opacity-70"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={cn("font-medium text-red-900", t.status === "done" && "line-through opacity-70")}>
                        {t.title}
                      </h4>
                      {t.notes && <p className="mt-0.5 line-clamp-2 text-sm text-red-900/70">{t.notes}</p>}
                    </div>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                      {t.difficulty ?? "medium"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-red-900/70">
                    {t.dueDate && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {t.category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {`List: ${getListName(t.listId)}`}
                    </span>
                    {Array.isArray(t.tags) &&
                      t.tags.slice(0, 3).map((tg: string) => (
                        <Badge key={tg} variant="secondary" className="bg-red-50 text-red-800">
                          {tg}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

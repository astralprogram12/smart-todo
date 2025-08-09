"use client"

import { useMemo } from "react"
import { useTasks } from "./task-context"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

export function SmartPanel() {
  const { tasks, smartResults, getListName } = useTasks()

  const visible = useMemo(() => {
    if (!smartResults || smartResults.length === 0) return []
    const map = new Map(tasks.map((t) => [t.id, t]))
    return smartResults.map((id: string) => map.get(id)).filter(Boolean) as typeof tasks
  }, [tasks, smartResults])

  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: "var(--tertiary)", background: "#ffffff" }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "var(--secondary)" }}>
          Smart Tasks
        </h2>
        <div className="text-xs" style={{ color: "color-mix(in srgb, var(--secondary) 70%, transparent)" }}>
          {visible.length > 0 ? `${visible.length} suggested` : "No suggestions yet"}
        </div>
      </div>

      {visible.length === 0 ? (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{ borderColor: "var(--tertiary)", background: "var(--tertiary-soft)", color: "var(--secondary)" }}
        >
          Ask the assistant below to filter or recommend tasks. Example: <em>{"What can I complete today?"}</em>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((t: any) => (
            <li
              key={t.id}
              className={cn("group rounded-xl border p-3 transition", t.status === "done" && "opacity-70")}
              style={{ borderColor: "var(--tertiary)", background: "#ffffff" }}
            >
              <div className="flex items-start gap-3">
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
                      {t.difficulty ?? "medium"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--secondary)" }}>
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

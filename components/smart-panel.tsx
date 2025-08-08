"use client"

import { useMemo } from "react"
import { useTasks } from "./task-context"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Tag } from 'lucide-react'

export function SmartPanel() {
  const { tasks, smartResults } = useTasks()
  const visible = useMemo(() => {
    if (!smartResults || smartResults.length === 0) return []
    const set = new Set(smartResults)
    return tasks.filter((t) => set.has(t.id))
  }, [tasks, smartResults])

  return (
    <section className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{'Smart Tasks'}</h2>
        <div className="text-xs text-white/60">{visible.length} selected</div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-white/60">
          {'Ask the assistant below to find or plan tasks. Example: '}
          <em>{"What can I complete today?"}</em>
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((t) => (
            <li key={t.id} className="rounded-xl border border-white/10 bg-black p-3">
              <div className="font-medium text-white">{t.title}</div>
              {t.notes && <div className="mt-0.5 text-sm text-white/70">{t.notes}</div>}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
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
                {t.tags.slice(0, 3).map((tg) => (
                  <Badge key={tg} variant="secondary" className="bg-white/10 text-white/80">
                    {tg}
                  </Badge>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTasks } from "./task-context"
import { Calendar, ListChecks } from "lucide-react"

type Props = {
  mode?: "create" | "edit"
  onSubmit?: (data: any) => void
  trigger?: React.ReactNode
  defaultValues?: {
    title?: string
    notes?: string
    dueDate?: string
    priority?: "low" | "medium" | "high"
    repeat?: "daily" | "weekly" | "custom" | "none"
    repeatEveryDays?: number
  }
}

export function TaskForm({
  mode = "create",
  onSubmit = () => {},
  trigger = <Button>{"Add Task"}</Button>,
  defaultValues = { title: "", notes: "", dueDate: "", priority: "medium", repeat: "none" },
}: Props) {
  const { addTask } = useTasks()
  const [open, setOpen] = useState(false)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [title, setTitle] = useState(defaultValues.title ?? "")
  const [notes, setNotes] = useState(defaultValues.notes ?? "")
  const [dueDate, setDueDate] = useState(
    defaultValues.dueDate && defaultValues.dueDate !== "" ? defaultValues.dueDate : todayStr,
  )
  const [priority, setPriority] = useState<"low" | "medium" | "high">(defaultValues.priority ?? "medium")

  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "custom">(defaultValues.repeat ?? "none")
  const [customCount, setCustomCount] = useState<number>(defaultValues.repeatEveryDays ?? 2)
  const [customUnit, setCustomUnit] = useState<"days" | "weeks">("days")

  const fieldBgClass =
    "bg-[rgba(255,255,255,0.08)] border border-white/15 text-white focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:outline-none"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: any = {
      title,
      notes,
      dueDate: dueDate || todayStr,
      priority,
    }
    if (repeat !== "none") {
      payload.repeat = repeat === "custom" ? "custom" : repeat
      if (repeat === "custom") {
        const days = Math.max(1, Number(customCount)) * (customUnit === "weeks" ? 7 : 1)
        payload.repeatEveryDays = days
      }
    }
    if (mode === "create") {
      await addTask(payload)
    }
    onSubmit(payload)
    setOpen(false)
    setTitle("")
    setNotes("")
    setDueDate(todayStr) // reset to today after close
    setPriority("medium")
    setRepeat("none")
  }

  return (
    <div>
      <div onClick={() => setOpen(true)} className="inline-block">
        {trigger}
      </div>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0f1a] p-5 text-white shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-violet-400" />
              <h3 className="text-lg font-semibold">{mode === "create" ? "New Task" : "Edit Task"}</h3>
            </div>

            <label className="mb-2 block text-sm text-white/80">{"Title"}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Prepare weekly status report"
              className={`mb-4 ${fieldBgClass} placeholder:text-white/50`}
              required
            />

            <label className="mb-2 block text-sm text-white/80">{"Notes"}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details..."
              className={`mb-4 ${fieldBgClass} placeholder:text-white/50`}
              rows={4}
            />

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="mb-2 block text-sm text-white/80">{"Due Date"}</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={fieldBgClass}
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-white/50" />
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="mb-2 block text-sm text-white/80">{"Priority"}</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className={`h-10 w-full rounded-md px-3 ${fieldBgClass}`}
                >
                  <option className="bg-[#0c0f1a]" value="low">
                    Low
                  </option>
                  <option className="bg-[#0c0f1a]" value="medium">
                    Medium
                  </option>
                  <option className="bg-[#0c0f1a]" value="high">
                    High
                  </option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="mb-2 block text-sm text-white/80">{"Repeat"}</label>
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as any)}
                  className={`h-10 w-full rounded-md px-3 ${fieldBgClass}`}
                >
                  <option className="bg-[#0c0f1a]" value="none">
                    None
                  </option>
                  <option className="bg-[#0c0f1a]" value="daily">
                    Daily
                  </option>
                  <option className="bg-[#0c0f1a]" value="weekly">
                    Weekly
                  </option>
                  <option className="bg-[#0c0f1a]" value="custom">
                    Every N…
                  </option>
                </select>
              </div>
            </div>

            {repeat === "custom" && (
              <div className="mb-4 grid grid-cols-3 items-end gap-3">
                <div className="col-span-1">
                  <label className="mb-2 block text-sm text-white/80">{"Every"}</label>
                  <Input
                    type="number"
                    min={1}
                    value={customCount}
                    onChange={(e) => setCustomCount(Number(e.target.value))}
                    className={fieldBgClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-2 block text-sm text-white/80">{"Unit"}</label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as any)}
                    className={`h-10 w-full rounded-md px-3 ${fieldBgClass}`}
                  >
                    <option className="bg-[#0c0f1a]" value="days">
                      Days
                    </option>
                    <option className="bg-[#0c0f1a]" value="weeks">
                      Weeks
                    </option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/15 bg-[rgba(255,255,255,0.06)] text-white"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-500 to-teal-500 text-white hover:opacity-90"
              >
                {mode === "create" ? "Add Task" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

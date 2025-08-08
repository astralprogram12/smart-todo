"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTasks } from "./task-context"
import { Calendar, ListChecks } from 'lucide-react'

type Props = {
  mode?: "create" | "edit"
  onSubmit?: (data: any) => void
  trigger?: React.ReactNode
  defaultValues?: {
    title?: string
    notes?: string
    dueDate?: string
    priority?: "low" | "medium" | "high"
  }
}

export function TaskForm({
  mode = "create",
  onSubmit = () => {},
  trigger = <Button>{'Add Task'}</Button>,
  defaultValues = { title: "", notes: "", dueDate: "", priority: "medium" },
}: Props) {
  const { addTask } = useTasks()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(defaultValues.title ?? "")
  const [notes, setNotes] = useState(defaultValues.notes ?? "")
  const [dueDate, setDueDate] = useState(defaultValues.dueDate ?? "")
  const [priority, setPriority] = useState<"low" | "medium" | "high">(defaultValues.priority ?? "medium")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { title, notes, dueDate: dueDate || undefined, priority }
    if (mode === "create") {
      await addTask(payload)
    }
    onSubmit(payload)
    setOpen(false)
    setTitle("")
    setNotes("")
    setDueDate("")
    setPriority("medium")
  }

  return (
    <div>
      <div onClick={() => setOpen(true)} className="inline-block">
        {trigger}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#161827] p-5 text-white shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-violet-400" />
              <h3 className="text-lg font-semibold">{mode === "create" ? "New Task" : "Edit Task"}</h3>
            </div>

            <label className="mb-2 block text-sm text-white/80">{'Title'}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Prepare weekly status report"
              className="mb-4 bg-white/5 text-white placeholder:text-white/50"
              required
            />

            <label className="mb-2 block text-sm text-white/80">{'Notes'}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details..."
              className="mb-4 bg-white/5 text-white placeholder:text-white/50"
              rows={4}
            />

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/80">{'Due Date'}</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-white/5 text-white"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-white/50" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/80">{'Priority'}</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 text-white"
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

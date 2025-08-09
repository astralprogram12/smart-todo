"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getAuthHeaders } from "@/lib/identity"

export type MemoryItem = {
  id?: string
  title: string
  content?: string | null
  importance?: number
  tags?: string[]
}

export function MemoryEditor({
  mode = "create",
  trigger,
  defaultValues,
  onSaved,
}: {
  mode?: "create" | "edit"
  trigger: React.ReactNode
  defaultValues?: MemoryItem
  onSaved?: (saved: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(defaultValues?.title ?? "")
  const [content, setContent] = useState(defaultValues?.content ?? "")
  const [importance, setImportance] = useState<number>(defaultValues?.importance ?? 3)
  const [tags, setTags] = useState<string>((defaultValues?.tags ?? []).join(", "))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const payload = {
        title: title.trim(),
        content: content?.toString()?.trim() || null,
        importance: Math.max(0, Math.min(10, Number(importance || 1))),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }
      let res: Response
      if (mode === "edit" && defaultValues?.id) {
        res = await fetch("/api/memory", {
          method: "PUT",
          headers,
          body: JSON.stringify({ id: defaultValues.id, ...payload }),
        })
      } else {
        res = await fetch("/api/memory", { method: "POST", headers, body: JSON.stringify(payload) })
      }
      const data = await res.json()
      if (res.ok) {
        onSaved?.(data.item ?? data)
        setOpen(false)
      } else {
        console.error("Memory save failed:", data?.error || data)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit memory" : "Add memory"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Content</label>
            <Textarea
              value={content ?? ""}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Optional details…"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700">Importance (0-10)</label>
              <Input
                type="number"
                min={0}
                max={10}
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">Tags (comma separated)</label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="preference, health, routine" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

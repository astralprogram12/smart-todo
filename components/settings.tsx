"use client"
import { useEffect, useMemo, useState } from "react"
import { SlidersHorizontal, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

type MemoryEntry = {
  id: string
  title: string
  content: string | null
  importance: number
  tags: string[] | null
  created_at: string
  updated_at: string
}

function ensureDeviceId() {
  try {
    const key = "smart_device_id"
    let id = localStorage.getItem(key)
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) + "-guest"
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return "web-guest"
  }
}

async function makeHeaders() {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-device-id": ensureDeviceId(),
  }
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const sp = createClient(url, key)
      const { data } = await sp.auth.getSession()
      const token = data.session?.access_token
      if (token) headers.authorization = `Bearer ${token}`
    }
  } catch {}
  return headers
}

export function Settings() {
  const [open, setOpen] = useState(false)
  const [mem, setMem] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const [brand, setBrand] = useState("#dc2626")
  const [secondary, setSecondary] = useState("#1f2937")
  const [tertiary, setTertiary] = useState("#e5e7eb")

  useEffect(() => {
    try {
      const b = localStorage.getItem("smart_theme_brand")
      const s = localStorage.getItem("smart_theme_secondary")
      const t = localStorage.getItem("smart_theme_tertiary")
      if (b) setBrand(b)
      if (s) setSecondary(s)
      if (t) setTertiary(t)
    } catch {}
  }, [])

  function dispatchTheme(next: { brand?: string; secondary?: string; tertiary?: string }) {
    window.dispatchEvent(new CustomEvent("theme:update", { detail: next }))
  }

  async function loadMemory() {
    setLoading(true)
    try {
      const headers = await makeHeaders()
      const res = await fetch("/api/memory", { method: "GET", headers })
      if (res.ok) {
        const data = await res.json()
        setMem(data.items ?? [])
      } else {
        setMem([])
      }
    } finally {
      setLoading(false)
    }
  }

  async function deleteMemory(id: string) {
    const headers = await makeHeaders()
    await fetch(`/api/memory?id=${encodeURIComponent(id)}`, { method: "DELETE", headers })
    setMem((arr) => arr.filter((x) => x.id !== id))
  }

  const brandPalette = useMemo(
    () => ["#dc2626", "#ef4444", "#f59e0b", "#10b981", "#6366f1", "#0ea5e9", "#9333ea", "#111827"],
    [],
  )
  const secondaryPalette = useMemo(
    () => ["#0f172a", "#111827", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#000000"],
    [],
  )
  const tertiaryPalette = useMemo(
    () => ["#e5e7eb", "#d1d5db", "#f3f4f6", "#e2e8f0", "#fef2f2", "#fee2e2", "#f5f5f4", "#ede9fe"],
    [],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) loadMemory()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-white"
          style={{ color: "var(--brand)", borderColor: "var(--brand)" }}
          aria-label="Open settings"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white" style={{ borderColor: "var(--brand)", borderWidth: 1 }}>
        <DialogHeader>
          <DialogTitle style={{ color: "var(--secondary)" }}>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="memory" className="w-full">
          <TabsList
            className="mb-4 grid w-full grid-cols-2 rounded-lg border bg-white"
            style={{ borderColor: "var(--brand)" }}
          >
            <TabsTrigger value="memory" className="data-[state=active]:text-[color:var(--on-brand)]">
              Memory
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:text-[color:var(--on-brand)]">
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="memory" className="mt-0">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm" style={{ color: "var(--secondary)" }}>
                {loading ? "Loading…" : `${mem.length} item${mem.length === 1 ? "" : "s"}`}
              </div>
              <Button
                onClick={loadMemory}
                variant="ghost"
                className="hover:opacity-80"
                style={{ color: "var(--brand)", background: "transparent" }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
            <ScrollArea className="h-72 rounded-lg border bg-white" style={{ borderColor: "var(--tertiary)" }}>
              <ul className="divide-y" style={{ borderColor: "var(--tertiary)" }}>
                {mem.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-4 p-3">
                    <div>
                      <div className="font-medium" style={{ color: "var(--secondary)" }}>
                        {m.title}
                      </div>
                      {m.content ? <div className="text-sm text-gray-600">{m.content}</div> : null}
                      <div className="mt-1 text-xs text-gray-400">
                        importance {m.importance} • {new Date(m.updated_at).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => deleteMemory(m.id)}
                      className="hover:bg-red-50"
                      style={{ color: "#dc2626" }}
                      aria-label={`Delete memory ${m.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {mem.length === 0 && !loading ? (
                  <li className="p-6 text-center text-sm text-gray-500">No memory yet.</li>
                ) : null}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 space-y-6">
            <div className="flex flex-col gap-4">
              {/* Brand color */}
              <div className="flex items-center gap-3">
                <Label htmlFor="brand" className="w-44 text-right" style={{ color: "var(--secondary)" }}>
                  Primary brand color
                </Label>
                <Input
                  id="brand"
                  type="color"
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value)
                    dispatchTheme({ brand: e.target.value })
                  }}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <div className="flex flex-wrap gap-2">
                  {brandPalette.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setBrand(p)
                        dispatchTheme({ brand: p })
                      }}
                      className="h-8 w-8 rounded-full border"
                      style={{ backgroundColor: p, borderColor: "var(--tertiary)" }}
                      aria-label={`Set brand ${p}`}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary color */}
              <div className="flex items-center gap-3">
                <Label htmlFor="secondary" className="w-44 text-right" style={{ color: "var(--secondary)" }}>
                  Secondary font color
                </Label>
                <Input
                  id="secondary"
                  type="color"
                  value={secondary}
                  onChange={(e) => {
                    setSecondary(e.target.value)
                    dispatchTheme({ secondary: e.target.value })
                  }}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <div className="flex flex-wrap gap-2">
                  {secondaryPalette.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setSecondary(p)
                        dispatchTheme({ secondary: p })
                      }}
                      className="h-8 w-8 rounded-full border"
                      style={{ backgroundColor: p, borderColor: "var(--tertiary)" }}
                      aria-label={`Set secondary ${p}`}
                    />
                  ))}
                </div>
              </div>

              {/* Tertiary color */}
              <div className="flex items-center gap-3">
                <Label htmlFor="tertiary" className="w-44 text-right" style={{ color: "var(--secondary)" }}>
                  Tertiary surface/border
                </Label>
                <Input
                  id="tertiary"
                  type="color"
                  value={tertiary}
                  onChange={(e) => {
                    setTertiary(e.target.value)
                    dispatchTheme({ tertiary: e.target.value })
                  }}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <div className="flex flex-wrap gap-2">
                  {tertiaryPalette.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setTertiary(p)
                        dispatchTheme({ tertiary: p })
                      }}
                      className="h-8 w-8 rounded-full border"
                      style={{ backgroundColor: p, borderColor: "var(--tertiary)" }}
                      aria-label={`Set tertiary ${p}`}
                    />
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl border p-4 text-sm"
                style={{
                  borderColor: "var(--tertiary)",
                  background: "var(--tertiary-soft)",
                  color: "var(--secondary)",
                }}
              >
                Preview • Containers use tertiary, text uses secondary, buttons use brand.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
      <style>{`
        /* Active tab tint */
        [role="tablist"] [role="tab"][data-state="active"] {
          background-color: var(--brand);
          color: var(--on-brand);
          border-color: var(--brand);
        }
      `}</style>
    </Dialog>
  )
}

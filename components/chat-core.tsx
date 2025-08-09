"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTasks } from "./task-context"
import { parseActionsFromAssistant, parseRecommendationsFromAssistant } from "@/lib/commands"
import { getAuthHeaders } from "@/lib/identity"

type Msg = { id: string; role: "user" | "assistant"; text: string }

type Props = {
  compact?: boolean
  height?: number
  showExtras?: boolean
}

// Remove fenced ```json ... ``` blocks (we still parse elsewhere)
function stripJsonBlocks(text: string) {
  const withoutCode = text.replace(/```json[\s\S]*?```/gi, "").replace(/```[\s\S]*?```/g, "")
  return withoutCode.trim()
}

export function ChatCore({ height = 300 }: Props) {
  const { tasks, lists, filters, applyActions, setSmartResults } = useTasks()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading])

  const taskContext = useMemo(
    () => ({
      now: new Date().toISOString(),
      lists: lists.map((l) => ({ id: l.id, name: l.name })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        dueDate: t.dueDate,
        priority: t.priority,
        difficulty: t.difficulty,
        category: t.category,
        tags: t.tags,
        listId: t.listId,
        status: t.status,
      })),
      filters,
    }),
    [tasks, lists, filters],
  )

  // Probe AI availability with identity headers so memory uses the same owner key.
  useEffect(() => {
    async function probe() {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch("/api/agent", {
          method: "POST",
          headers,
          body: JSON.stringify({ history: [], taskContext }),
        })
        setAiAvailable(res.ok)
      } catch {
        setAiAvailable(false)
      }
    }
    probe()
  }, [])

  async function submitMessage(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const text = input.trim()
    if (!text) return
    const id = crypto.randomUUID()
    const newHistory = [...messages, { id, role: "user", text }]
    setMessages(newHistory)
    setInput("")
    setIsLoading(true)

    try {
      const headers = await getAuthHeaders()
      const res = await fetch("/api/agent", {
        method: "POST",
        headers,
        body: JSON.stringify({
          history: newHistory.map((m) => ({ role: m.role, text: m.text })),
          taskContext,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { text: string }
      const reply = data.text ?? "..."
      const asstMsg: Msg = { id: crypto.randomUUID(), role: "assistant", text: reply }
      setMessages((prev) => [...prev, asstMsg])

      const actions = parseActionsFromAssistant(reply)
      if (actions.length > 0) applyActions(actions)

      const recs = parseRecommendationsFromAssistant(reply)
      if (recs.length > 0) {
        const ids = new Set<string>()
        for (const r of recs) {
          if (r.id) ids.add(r.id)
          else if (r.title) {
            const lower = r.title.toLowerCase().trim()
            const match =
              tasks.find((t) => t.title.toLowerCase().trim() === lower) ??
              tasks.find((t) => t.title.toLowerCase().includes(lower))
            if (match) ids.add(match.id)
          }
        }
        if (ids.size > 0) setSmartResults(Array.from(ids))
      } else if (actions.some((a) => a.type === "set_filter")) {
        const idsFromFilter = computeIdsFromFilter(actions, tasks, lists)
        if (idsFromFilter.length > 0) setSmartResults(idsFromFilter)
      }
    } catch {
      setError("Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section
      className="relative rounded-2xl border p-4 shadow-xl"
      style={{
        borderColor: "var(--tertiary)",
        background: "linear-gradient(to bottom, #ffffff, var(--tertiary-soft))",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "var(--secondary)" }}>
          Assistant
        </h2>
        <div className="text-xs" style={{ color: "color-mix(in srgb, var(--secondary) 70%, transparent)" }}>
          {aiAvailable === null ? "Checking AI..." : aiAvailable ? "AI Ready" : "Local mode"}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mb-3 w-full overflow-y-auto rounded-2xl border p-3"
        style={{ borderColor: "var(--tertiary)", background: "#ffffff", height }}
      >
        {messages.length === 0 && (
          <div className="text-sm" style={{ color: "color-mix(in srgb, var(--secondary) 70%, transparent)" }}>
            {"Try: "}
            <em>{"What can I complete today?"}</em>, {"Add task: Buy milk tomorrow"}, {"Show errands due this week"}
          </div>
        )}
        <div className="space-y-3">
          {messages.map((m) => {
            const cleaned = m.role === "assistant" ? stripJsonBlocks(m.text) : m.text
            const isUser = m.role === "user"
            return (
              <div key={m.id} className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="mt-0.5 rounded-full p-1" style={{ background: "var(--brand-soft)" }}>
                    <Bot className="h-4 w-4" style={{ color: "var(--brand)" }} />
                  </div>
                )}
                <div
                  className={[
                    "max-w-[80%] whitespace-pre-wrap text-sm rounded-2xl px-3 py-2",
                    isUser ? "" : "border",
                  ].join(" ")}
                  style={
                    isUser
                      ? { background: "var(--brand)", color: "var(--on-brand)" }
                      : {
                          background: "var(--tertiary-soft)",
                          color: "var(--secondary)",
                          borderColor: "var(--tertiary)",
                        }
                  }
                >
                  {cleaned}
                </div>
                {isUser && (
                  <div className="mt-0.5 rounded-full p-1" style={{ background: "var(--brand-soft)" }}>
                    <User className="h-4 w-4" style={{ color: "var(--brand)" }} />
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--brand)" }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking...
            </div>
          )}
          {error && (
            <div className="text-sm" style={{ color: "color-mix(in srgb, var(--secondary) 85%, transparent)" }}>
              {error}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={submitMessage} className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chat here..."
          className="h-11 rounded-full bg-white"
          style={{ borderColor: "var(--tertiary)", color: "var(--secondary)" }}
        />
        <Button
          type="submit"
          className="h-11 rounded-full px-4"
          style={{ background: "var(--brand)", color: "var(--on-brand)", borderColor: "var(--brand)" }}
        >
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
      </form>
    </section>
  )

  function computeIdsFromFilter(actions: any[], tasks: any[], lists: any[]) {
    const setFilter = actions.find((a) => a.type === "set_filter")
    if (!setFilter) return []
    const now = new Date()
    const weekAhead = new Date()
    weekAhead.setDate(now.getDate() + 7)

    let filtered = [...tasks]
    if (setFilter.listName) {
      const list = lists.find((l) => l.name.toLowerCase() === setFilter.listName.toLowerCase())
      if (list) filtered = filtered.filter((t) => t.listId === list.id)
    }
    if (setFilter.category) filtered = filtered.filter((t) => t.category === setFilter.category)
    if (setFilter.tag) filtered = filtered.filter((t) => (t.tags ?? []).includes(setFilter.tag))
    if (setFilter.view && setFilter.view !== "all") {
      filtered = filtered.filter((t) => {
        const due = t.dueDate ? new Date(t.dueDate) : undefined
        if (setFilter.view === "today") {
          if (!due) return false
          return (
            due.getFullYear() === now.getFullYear() &&
            due.getMonth() === now.getMonth() &&
            due.getDate() === now.getDate()
          )
        } else if (setFilter.view === "overdue") {
          return !!due && due < now
        } else if (setFilter.view === "week") {
          return !!due && due >= now && due <= weekAhead
        } else if (setFilter.view === "none") {
          return !due
        }
        return true
      })
    }
    return filtered.map((t) => t.id)
  }
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTasks } from "./task-context"
import { parseActionsFromAssistant, parseRecommendationsFromAssistant } from "@/lib/commands"
import { getLocalGeminiKey } from "./api-key-settings"

type Msg = { id: string; role: "user" | "assistant"; text: string }

type Props = {
  compact?: boolean
  height?: number
  showExtras?: boolean
}

// Remove fenced \`\`\`json ... \`\`\` blocks (but still parse them for actions)
function stripJsonBlocks(text: string) {
  // Remove any fenced code blocks (json or otherwise)
  const withoutCode = text.replace(/\`\`\`json[\s\S]*?\`\`\`/gi, "").replace(/\`\`\`[\s\S]*?\`\`\`/g, "")
  return withoutCode.trim()
}

export function ChatCore({ compact = false, height = 300, showExtras = false }: Props) {
  const { tasks, lists, filters, applyActions, setSmartResults } = useTasks()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Track local Gemini key
  useEffect(() => {
    const load = () => setApiKey(getLocalGeminiKey())
    load()
    const onUpdate = () => load()
    window.addEventListener("gemini-key-updated", onUpdate as any)
    return () => window.removeEventListener("gemini-key-updated", onUpdate as any)
  }, [])

  // Auto scroll
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
    [tasks, lists, filters]
  )

  // Probe availability
  useEffect(() => {
    async function probe() {
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(apiKey ? { "x-gemini-key": apiKey } : {}) },
          body: JSON.stringify({ history: [], taskContext }),
        })
        setAiAvailable(res.ok)
      } catch {
        setAiAvailable(false)
      }
    }
    probe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

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
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(apiKey ? { "x-gemini-key": apiKey } : {}) },
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

      // Apply actions and compute Smart results
      const actions = parseActionsFromAssistant(reply)
      if (actions.length > 0) {
        applyActions(actions)
      }
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
    } catch (err: any) {
      setError("Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-950 to-black p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{'Assistant'}</h2>
        <div className="text-xs text-white/60">
          {aiAvailable === null ? "Checking AI..." : aiAvailable ? "Gemini AI On" : "Local mode"}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mb-3 w-full overflow-y-auto rounded-2xl border border-white/10 bg-black/60 p-3 backdrop-blur-sm"
        style={{ height }}
      >
        {messages.length === 0 && (
          <div className="text-sm text-white/60">
            {'Try: '}<em>{"What can I complete today?"}</em>, {"Add task: Buy milk tomorrow"}, {"Show errands due this week"}
          </div>
        )}
        <div className="space-y-3">
          {messages.map((m) => {
            const cleaned = m.role === "assistant" ? stripJsonBlocks(m.text) : m.text
            const isUser = m.role === "user"
            return (
              <div key={m.id} className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="mt-0.5 rounded-full bg-white/10 p-1">
                    <Bot className="h-4 w-4 text-white/80" />
                  </div>
                )}
                <div
                  className={[
                    "max-w-[80%] whitespace-pre-wrap text-sm",
                    "rounded-2xl px-3 py-2",
                    isUser ? "bg-white text-black shadow-sm" : "bg-white/10 text-white/90 border border-white/10",
                  ].join(" ")}
                >
                  {cleaned}
                </div>
                {isUser && (
                  <div className="mt-0.5 rounded-full bg-white/10 p-1">
                    <User className="h-4 w-4 text-white/80" />
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {'Thinking...'}
            </div>
          )}
          {error && <div className="text-sm text-rose-300">{error}</div>}
        </div>
      </div>

      <form onSubmit={submitMessage} className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chat here..."
          className="h-11 rounded-full border-white/20 bg-black text-white placeholder:text-white/50 focus-visible:ring-0"
        />
        <Button type="submit" className="h-11 rounded-full border border-white/20 bg-white px-4 text-black hover:bg-white/90">
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

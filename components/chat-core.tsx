"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Send, Sparkles, Bot, User, CheckCircle2, Loader2, Wand2 } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTasks } from "./task-context"
import { parseActionsFromAssistant } from "@/lib/commands"

export function ChatCore() {
  const { tasks, lists, filters, applyActions, exportSnapshot } = useTasks()
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)

  // Minimal availability probe via the chat route (falls back gracefully)
  useEffect(() => {
    async function probe() {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], taskContext: {} }),
        })
        setAiAvailable(res.ok)
      } catch {
        setAiAvailable(false)
      }
    }
    probe()
  }, [])

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

  const { messages, input, setInput, isLoading, handleSubmit } = useChat({
    api: "/api/chat",
    body: { taskContext },
  })

  const scrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading])

  // Apply any assistant actions found in the most recent assistant message
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistant) return
    const text = lastAssistant.content
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("\n")
    const actions = parseActionsFromAssistant(text)
    if (actions.length > 0) {
      applyActions(actions)
    }
  }, [messages, applyActions])

  function quick(prompt: string) {
    setInput(prompt)
  }

  return (
    <section className="relative mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur lg:mb-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold">{'Assistant'}</h2>
        </div>
        <div className="text-xs text-white/70">
          {aiAvailable === null ? "Checking AI..." : aiAvailable ? "Gemini AI On" : "Local mode"}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mb-3 h-[460px] overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3"
      >
        {messages.length === 0 && (
          <div className="text-sm text-white/70">
            {'Try: '}<em>{"Add task: Buy milk tomorrow"}</em>, {"What can I complete today?"}, {"Move 'Buy milk' to Groceries"}
          </div>
        )}
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-2">
              <div className={`mt-0.5 rounded-full p-1 ${m.role === "user" ? "bg-teal-500/20" : "bg-violet-500/20"}`}>
                {m.role === "user" ? (
                  <User className="h-4 w-4 text-teal-300" />
                ) : (
                  <Bot className="h-4 w-4 text-violet-300" />
                )}
              </div>
              <div className="whitespace-pre-wrap text-sm text-white/90">
                {m.content.map((p, i) => (p.type === "text" ? <div key={`${m.id}-${i}`}>{p.text}</div> : null))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {'Thinking...'}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(e)
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chat here... e.g., Add task: Email client today"
          className="bg-white/5 text-white placeholder:text-white/60"
        />
        <Button type="submit" className="bg-gradient-to-r from-violet-500 to-teal-500 text-white hover:opacity-90">
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Quick label="Complete today" onClick={() => quick("What can I complete today?")} />
        <Quick label="Quick wins" onClick={() => quick("Suggest 5 quick tasks and add them")} />
        <Quick label="Plan morning" onClick={() => quick("Plan my morning in 3 steps with tasks")} />
        <Quick label="Group by lists" onClick={() => quick("Group my tasks into lists and update them")} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/60">
        <button
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10"
          onClick={() => {
            const data = exportSnapshot()
            navigator.clipboard.writeText(JSON.stringify(data, null, 2))
          }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {'Copy snapshot'}
        </button>
        <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1">
          <Wand2 className="h-3.5 w-3.5" />
          {'Assistant can add/update/complete/delete tasks via JSON actions.'}
        </div>
      </div>
    </section>
  )
}

function Quick({ label = "Quick", onClick = () => {} }: { label?: string; onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
    >
      <Sparkles className="mr-2 h-4 w-4 text-violet-300" />
      {label}
    </Button>
  )
}

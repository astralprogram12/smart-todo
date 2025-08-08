"use client"

import { AppHeader } from "@/components/app-header"
import { TaskProvider } from "@/components/task-context"
import { ChatCore } from "@/components/chat-core"
import { TaskPanel } from "@/components/task-panel"

export default function HomePage() {
  return (
    <TaskProvider>
      <main className="min-h-screen bg-gradient-to-b from-[#0f1020] via-[#141527] to-[#0f1115] text-white">
        <div className="relative">
          <div className="absolute inset-0 -z-10 opacity-50">
            <img
              src="/images/hero-texture.png"
              alt="Abstract gradient texture"
              className="h-56 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          </div>
          <AppHeader />
        </div>

        <div className="mx-auto max-w-7xl gap-6 px-4 pb-20 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          <ChatCore />
          <TaskPanel />
        </div>
      </main>
    </TaskProvider>
  )
}

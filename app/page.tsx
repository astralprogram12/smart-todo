"use client"

import ThemeClient from "@/components/theme-client"
import { AppHeader } from "@/components/app-header"
import { TaskProvider } from "@/components/task-context"
import { ChatCore } from "@/components/chat-core"
import { TaskPanel } from "@/components/task-panel"
import { SmartPanel } from "@/components/smart-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGate } from "@/components/auth-gate"

export default function HomePage() {
  return (
    <TaskProvider>
      <ThemeClient />
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
        <AppHeader />
        <div className="mx-auto max-w-5xl px-4 pb-16">
          <AuthGate allowGuest>
            <Tabs defaultValue="smart" className="w-full">
              <TabsList
                className="mb-6 flex gap-2 rounded-xl border bg-white p-1"
                style={{ borderColor: "var(--brand)" }}
              >
                <TabsTrigger
                  value="smart"
                  className="rounded-lg border border-transparent px-4 py-2 text-sm"
                  style={{
                    color: "var(--brand)",
                  }}
                  data-active-style="tabs"
                >
                  Smart Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="rounded-lg border border-transparent px-4 py-2 text-sm"
                  style={{
                    color: "var(--brand)",
                  }}
                >
                  All Tasks
                </TabsTrigger>
              </TabsList>

              <TabsContent value="smart" className="space-y-6">
                <SmartPanel />
                <ChatCore compact height={260} showExtras={false} />
              </TabsContent>

              <TabsContent value="all" className="space-y-6">
                <TaskPanel />
              </TabsContent>
            </Tabs>
          </AuthGate>
        </div>
      </main>
      <style>{`
        /* Make active tab use brand bg and white text */
        [data-state="active"] {
          background-color: var(--brand) !important;
          color: var(--on-brand) !important;
          border-color: var(--brand) !important;
        }
      `}</style>
    </TaskProvider>
  )
}

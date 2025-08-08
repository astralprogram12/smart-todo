"use client"

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
      <main className="min-h-screen bg-gradient-to-b from-white to-red-50 text-red-900">
        <AppHeader />
        <div className="mx-auto max-w-5xl px-4 pb-16">
          <AuthGate allowGuest>
            <Tabs defaultValue="smart" className="w-full">
              <TabsList className="mb-6 flex gap-2 rounded-xl border border-red-200 bg-white p-1">
                <TabsTrigger
                  value="smart"
                  className="rounded-lg border border-transparent px-4 py-2 text-sm text-red-900 data-[state=active]:border-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white"
                >
                  Smart Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="rounded-lg border border-transparent px-4 py-2 text-sm text-red-900 data-[state=active]:border-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white"
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
    </TaskProvider>
  )
}

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
      <main className="min-h-screen bg-black text-white">
        <AppHeader />
        <div className="mx-auto max-w-5xl px-4 pb-16">
          <AuthGate allowGuest>
            <Tabs defaultValue="smart" className="w-full">
              <TabsList className="mb-6 border border-white/10 bg-black">
                <TabsTrigger value="smart" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Smart Tasks
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">
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

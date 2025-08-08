"use client"

import { ClipboardCheck, LogOut } from 'lucide-react'
import { ApiKeySettings } from "./api-key-settings"
import { useTasks } from "./task-context"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function AppHeader() {
  const { source } = useTasks()
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getUser()
      if (active) setEmail(data.user?.email ?? null)
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        setEmail(session?.user?.email ?? null)
      })
      return () => sub.subscription.unsubscribe()
    })()
    return () => {
      active = false
    }
  }, [supabase])

  async function signOut() {
    await supabase?.auth.signOut()
    router.refresh()
  }

  const supa = source === "supabase"
  return (
    <header className="mx-auto max-w-5xl px-4 pb-6 pt-8 text-white">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2">
            <ClipboardCheck className="h-6 w-6 text-white/80" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{'SmartTask Chat'}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-white/60">{'Black & white • Chat to add, organize, and complete tasks'}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs ${supa ? "border border-white/20 bg-white/10 text-white" : "border border-white/10 text-white/60"}`}>
                {supa ? "Supabase Connected" : "Local Only"}
              </span>
              {email && (
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/90">
                  {email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ApiKeySettings />
          {email ? (
            <Button onClick={signOut} variant="outline" className="border-white/20 bg-black text-white hover:bg-white/5">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <Button onClick={() => router.push("/login")} variant="outline" className="border-white/20 bg-black text-white hover:bg-white/5">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

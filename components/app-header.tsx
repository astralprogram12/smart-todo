"use client"

import { ClipboardCheck, LogOut } from 'lucide-react'
import { getSupabaseClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function AppHeader() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (mounted) setEmail(data.user?.email ?? null)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function signOut() {
    await supabase?.auth.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 mx-auto mb-4 w-full max-w-5xl bg-white/90 px-4 pb-4 pt-6 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-red-200 bg-red-50 p-2">
            <ClipboardCheck className="h-6 w-6 text-red-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-red-900">SmartTask Chat</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {email ? (
            <Button
              onClick={signOut}
              variant="outline"
              className="border-red-600 bg-white text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="border-red-600 bg-white text-red-700 hover:bg-red-50"
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

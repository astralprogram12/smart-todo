"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import ThemeClient from "@/components/theme-client"
import { Settings } from "@/components/settings"

function AppHeader() {
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
    <header
      className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      style={{ borderColor: "var(--tertiary)" }}
    >
      <ThemeClient />
      <div className="mx-auto flex max-w-5xl items-end justify-between px-4 pb-3 pt-5">
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl border p-2"
            style={{ borderColor: "var(--tertiary)", background: "var(--brand-soft)" }}
          >
            <ClipboardCheck className="h-6 w-6" style={{ color: "var(--brand)" }} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--secondary)" }}>
            SmartTask Chat
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Settings />
          {email ? (
            <Button
              onClick={signOut}
              variant="outline"
              className="bg-white"
              style={{ color: "var(--brand)", borderColor: "var(--brand)" }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <Button
              onClick={() => router.push("/login?mode=signup")}
              variant="outline"
              className="bg-white"
              style={{ color: "var(--brand)", borderColor: "var(--brand)" }}
            >
              Sign up
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default AppHeader
export { AppHeader }

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

const GUEST_OK_KEY = "smart_todo_guest_ok"

export function AuthGate({
  children,
  allowGuest = true,
}: {
  children: React.ReactNode
  allowGuest?: boolean
}) {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const guestOk = localStorage.getItem(GUEST_OK_KEY) === "1"
      if (!supabase) {
        // No Supabase configured; let them in.
        if (mounted) {
          setAuthed(true)
          setLoading(false)
        }
        return
      }
      const { data } = await supabase.auth.getSession()
      if (mounted) {
        setAuthed(!!data.session || guestOk)
        setLoading(false)
      }
      // listen for auth changes
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthed(!!session || (allowGuest && localStorage.getItem(GUEST_OK_KEY) === "1"))
      })
      return () => {
        sub.subscription.unsubscribe()
      }
    })()
    return () => {
      mounted = false
    }
  }, [supabase, allowGuest])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">{'Checking session...'}</div>
    )
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black p-6 text-white">
        <h2 className="text-xl font-semibold">{'Welcome to SmartTask Chat'}</h2>
        <p className="mt-2 text-sm text-white/70">
          {'Sign in to sync your tasks across devices. You can also continue as a guest.'}
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            className="border border-white/20 bg-white text-black hover:bg-white/90"
            onClick={() => router.push("/login")}
          >
            {'Sign in'}
          </Button>
          {allowGuest && (
            <Button
              variant="outline"
              className="border-white/20 bg-black text-white hover:bg-white/5"
              onClick={() => {
                localStorage.setItem(GUEST_OK_KEY, "1")
                setAuthed(true)
              }}
            >
              {'Continue as guest'}
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-white/60">
          {'You can add an account later from the header menu.'}
        </p>
      </div>
    )
  }

  return <>{children}</>
}

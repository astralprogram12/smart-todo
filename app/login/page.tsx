"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import AppHeader from "@/components/app-header"

export default function LoginPage() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const m = searchParams.get("mode")
    if (m === "signup") setMode("signup")
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setError("Supabase is not configured.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push("/")
        router.refresh()
      } else {
        // Sign up then ask user to check email
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        try {
          localStorage.setItem("last_signup_email", email.trim())
        } catch {}
        router.push(`/check-email?email=${encodeURIComponent(email.trim())}`)
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <AppHeader />
      <div className="mx-auto flex max-w-md justify-center px-4 py-10">
        <Card className="w-full border-[color:var(--brand)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl" style={{ color: "var(--secondary)" }}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm" style={{ color: "var(--secondary)" }}>
                  {"Email"}
                </label>
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white placeholder:text-gray-400"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm" style={{ color: "var(--secondary)" }}>
                  {"Password"}
                </label>
                <Input
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex items-center justify-between">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[color:var(--brand)] text-[color:var(--on-brand)] hover:opacity-90"
                >
                  {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
                </Button>
                <button
                  type="button"
                  className="text-sm underline"
                  style={{ color: "var(--brand)" }}
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Have an account? Sign in"}
                </button>
              </div>
              {mode === "signin" ? (
                <div className="pt-2 text-sm">
                  {"No account yet? "}
                  <button
                    type="button"
                    className="underline"
                    style={{ color: "var(--brand)" }}
                    onClick={() => setMode("signup")}
                  >
                    Create one
                  </button>
                </div>
              ) : (
                <div className="pt-2 text-sm text-gray-500">
                  You&apos;ll receive a confirmation email. After confirming, you can sign in.
                </div>
              )}
            </form>

            <div className="mt-6 text-center text-sm">
              <Link href="/" className="underline" style={{ color: "var(--brand)" }}>
                Back to app
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

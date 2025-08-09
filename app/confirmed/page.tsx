"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import AppHeader from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function ConfirmedPage() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setError("Supabase is not configured.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/")
      router.refresh()
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
              Congrats! Your email is confirmed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-gray-600">You can now log in to your account. Welcome!</p>
            <form onSubmit={handleSignIn} className="space-y-4">
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[color:var(--brand)] text-[color:var(--on-brand)] hover:opacity-90"
              >
                {loading ? "Please wait…" : "Sign in"}
              </Button>
            </form>
            <div className="text-center text-sm">
              <Link href="/login" className="underline" style={{ color: "var(--brand)" }}>
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

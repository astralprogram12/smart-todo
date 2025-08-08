"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      router.push("/")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <Card className="w-full max-w-md border-white/10 bg-black text-white">
        <CardHeader>
          <CardTitle className="text-xl">{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/80">{'Email'}</label>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black text-white placeholder:text-white/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/80">{'Password'}</label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black text-white placeholder:text-white/50"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <div className="flex items-center justify-between">
              <Button type="submit" disabled={loading} className="border border-white/20 bg-white text-black hover:bg-white/90">
                {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
              </Button>
              <button
                type="button"
                className="text-sm text-white/70 underline hover:text-white"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Create an account" : "Have an account? Sign in"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

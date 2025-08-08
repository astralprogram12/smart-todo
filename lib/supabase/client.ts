import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function getSupabaseClient() {
  if (client) return client
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()
  if (!url || !anon) return null
  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "smart_todo_supabase_auth",
    },
  })
  return client
}

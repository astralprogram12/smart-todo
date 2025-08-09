"use client"

// Returns a stable per-device id for guests.
export function ensureDeviceId(): string {
  try {
    const key = "smart_device_id"
    let id = localStorage.getItem(key)
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) + "-guest"
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return "web-guest"
  }
}

// Builds headers with x-device-id and Authorization (if signed in).
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-device-id": ensureDeviceId(),
  }
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const sp = createClient(url, key)
      const { data } = await sp.auth.getSession()
      const token = data.session?.access_token
      if (token) headers.authorization = `Bearer ${token}`
    }
  } catch {}
  return headers
}

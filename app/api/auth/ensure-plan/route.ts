import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function svc() {
  const url = process.env.SUPABASE_URL as string
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function POST(req: Request) {
  try {
    const supa = svc()
    const auth = (req.headers as any).get?.("authorization") || ""
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const token = auth.slice("Bearer ".length)
    const { data, error } = await supa.auth.getUser(token)
    if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const uid = data.user.id

    const { data: plan } = await supa.from("user_plan").select("plan").eq("user_id", uid).maybeSingle()
    if (!plan) {
      await supa.from("user_plan").insert({ user_id: uid, plan: "free" })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

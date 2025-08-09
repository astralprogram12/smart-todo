import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function svc() {
  const url = process.env.SUPABASE_URL as string
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function getUserId(req: NextRequest) {
  const supa = svc()
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length)
    const { data, error } = await supa.auth.getUser(token)
    if (!error && data.user?.id) return data.user.id
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const supa = svc()
    const uid = await getUserId(req)
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 })

    const nowIso = new Date().toISOString()
    const { data: pending } = await supa
      .from("wa_verifications")
      .select("*")
      .eq("user_id", uid)
      .eq("status", "pending")
      .gte("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!pending) {
      return NextResponse.json({ error: "No pending code or expired" }, { status: 400 })
    }

    if (String(pending.code).trim() !== String(code).trim()) {
      await supa
        .from("wa_verifications")
        .update({ attempts: (pending.attempts ?? 0) + 1 })
        .eq("id", pending.id)
      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }

    await supa.from("wa_verifications").update({ status: "verified" }).eq("id", pending.id)
    await supa.from("user_whatsapp").upsert(
      {
        user_id: uid,
        phone: pending.phone,
        status: "connected",
        wa_connected: true,
      },
      { onConflict: "user_id" },
    )

    return NextResponse.json({ verified: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

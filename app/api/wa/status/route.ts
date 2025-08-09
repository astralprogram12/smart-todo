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

export async function GET(req: NextRequest) {
  try {
    const supa = svc()
    const uid = await getUserId(req)
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Ensure user_plan row exists (default free)
    const { data: planRow } = await supa.from("user_plan").select("plan").eq("user_id", uid).maybeSingle()
    if (!planRow) {
      await supa.from("user_plan").insert({ user_id: uid, plan: "free" })
    }

    const { data: plan } = await supa.from("user_plan").select("plan").eq("user_id", uid).maybeSingle()
    const premium = (plan?.plan ?? "free") === "premium"

    const { data: wa } = await supa
      .from("user_whatsapp")
      .select("phone,status,wa_connected")
      .eq("user_id", uid)
      .maybeSingle()

    return NextResponse.json({
      premium,
      whatsapp: {
        phone: wa?.phone ?? null,
        status: wa?.status ?? "disconnected",
        wa_connected: wa?.wa_connected ?? false,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

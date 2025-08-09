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

function genOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const supa = svc()
    const uid = await getUserId(req)
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { countryCode, phone } = await req.json()
    const fonnteToken = process.env.FONNTE_TOKEN
    if (!fonnteToken) return NextResponse.json({ error: "Missing FONNTE_TOKEN env" }, { status: 500 })

    // Check premium
    const { data: plan } = await supa.from("user_plan").select("plan").eq("user_id", uid).maybeSingle()
    if ((plan?.plan ?? "free") !== "premium") {
      return NextResponse.json({ error: "Premium required" }, { status: 403 })
    }

    // Create or upsert user_whatsapp pending
    await supa
      .from("user_whatsapp")
      .upsert({ user_id: uid, phone, status: "pending", wa_connected: false }, { onConflict: "user_id" })

    // Create OTP entry
    const code = genOTP()
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    await supa.from("wa_verifications").insert({
      user_id: uid,
      phone,
      code,
      status: "pending",
      expires_at: expires,
    })

    // Send via Fonnte
    const form = new FormData()
    form.set("target", phone)
    form.set("message", `SmartTask OTP: ${code}. Expires in 10 minutes.`)
    form.set("schedule", "0")
    form.set("typing", "false")
    form.set("delay", "2")
    if (countryCode) form.set("countryCode", String(countryCode))

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: fonnteToken },
      body: form,
    })
    const txt = await res.text()

    if (!res.ok) {
      return NextResponse.json({ error: "Fonnte send failed", details: txt }, { status: 502 })
    }

    return NextResponse.json({ sent: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Helper to create the admin client
function svc() {
  const url = process.env.SUPABASE_URL as string
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// Helper to get the authenticated user's ID
async function getUserId(req: NextRequest): Promise<string | null> {
  const supa = svc()
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length)
    try {
      const { data, error } = await supa.auth.getUser(token)
      if (!error && data.user?.id) return data.user.id
    } catch {
      // Invalid token
    }
  }
  return null
}

// Helper to generate a 6-digit OTP
function genOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const supa = svc()
    const uid = await getUserId(req)
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { countryCode, phone } = await req.json()
    const fonnteToken = process.env.FONNTE_TOKEN
    
    // --- Data Validation ---
    if (!fonnteToken) {
      console.error("Server Error: Missing FONNTE_TOKEN env variable.")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    if (!countryCode || !phone) {
        return NextResponse.json({ error: "Country code and phone number are required." }, { status: 400 })
    }

    // --- Check Premium Plan ---
    const { data: plan } = await supa.from("user_plan").select("plan").eq("user_id", uid).single()
    if ((plan?.plan ?? "free") !== "premium") {
      return NextResponse.json({ error: "A premium plan is required for WhatsApp integration." }, { status: 403 })
    }

    // --- THIS IS THE KEY CHANGE ---
    // Construct the full phone number before using it.
    // We remove any leading '0' from the local phone number as is standard.
    const fullPhoneNumber = `${countryCode}${phone.replace(/^0+/, '')}`

    // --- Update Database with the FULL Phone Number ---
    // Create or upsert user_whatsapp pending status
    await supa
      .from("user_whatsapp")
      .upsert({ user_id: uid, phone: fullPhoneNumber, status: "pending", wa_connected: false }, { onConflict: "user_id" })

    // Create OTP entry with the FULL phone number
    const code = genOTP()
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    await supa.from("wa_verifications").insert({
      user_id: uid,
      phone: fullPhoneNumber,
      code,
      status: "pending",
      expires_at: expires,
    })

    // --- Send OTP via Fonnte ---
    const form = new FormData()
    // The 'target' for Fonnte can be just the local part if countryCode is provided separately
    form.set("target", phone) 
    form.set("message", `SmartTask OTP: ${code}. Expires in 10 minutes.`)
    form.set("countryCode", String(countryCode))
    // Other Fonnte parameters
    form.set("schedule", "0")
    form.set("typing", "false")
    form.set("delay", "2")

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: fonnteToken },
      body: form,
    })
    
    const txt = await res.text()
    if (!res.ok) {
      console.error("Fonnte send failed:", txt)
      return NextResponse.json({ error: "Failed to send OTP via Fonnte", details: txt }, { status: 502 })
    }

    return NextResponse.json({ sent: true })
  } catch (e: any) {
    console.error("OTP Send Error:", e.message)
    return NextResponse.json({ error: e?.message || "An unknown server error occurred" }, { status: 500 })
  }
}

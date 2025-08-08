import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const { deviceId } = await req.json()
    const authHeader = req.headers.get("authorization") || ""

    if (!deviceId || !authHeader?.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Missing deviceId or Authorization" }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: "Server not configured for migration" }, { status: 500 })
    }

    // Admin client (service role) — bypasses RLS; keep server-side only [^1]
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    })

    // Verify the caller is an authenticated user
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const uid = userData.user.id

    if (uid === deviceId) {
      return NextResponse.json({ migrated: false, reason: "Nothing to migrate" })
    }

    // Move lists and tasks from the device scope to the user scope
    const { error: lerr } = await supabaseAdmin
      .from("lists")
      .update({ device_id: uid })
      .eq("device_id", deviceId)

    if (lerr) {
      return NextResponse.json({ error: "Failed to migrate lists", details: lerr.message }, { status: 500 })
    }

    const { error: terr } = await supabaseAdmin
      .from("tasks")
      .update({ device_id: uid })
      .eq("device_id", deviceId)

    if (terr) {
      return NextResponse.json({ error: "Failed to migrate tasks", details: terr.message }, { status: 500 })
    }

    return NextResponse.json({ migrated: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}

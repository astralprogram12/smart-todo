import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function resolveOwner(req: NextRequest, admin: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (token) {
    try {
      const { data, error } = await admin.auth.getUser(token)
      if (!error && data.user) return data.user.id
    } catch {
      // fall through to device id
    }
  }
  const device = req.headers.get("x-device-id")
  if (device) return device
  return null
}

export async function GET(req: NextRequest) {
  const admin = getAdmin()
  if (!admin) return NextResponse.json({ error: "Server not configured" }, { status: 503 })
  const owner = await resolveOwner(req, admin)
  if (!owner) return NextResponse.json({ error: "Missing identity" }, { status: 400 })

  const { data, error } = await admin
    .from("memory_entries")
    .select("*")
    .eq("owner_key", owner)
    .order("updated_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = getAdmin()
  if (!admin) return NextResponse.json({ error: "Server not configured" }, { status: 503 })
  const owner = await resolveOwner(req, admin)
  if (!owner) return NextResponse.json({ error: "Missing identity" }, { status: 400 })

  const body = await req.json()
  const payload = {
    owner_key: owner,
    title: String(body.title ?? "Note"),
    content: body.content ? String(body.content) : null,
    importance: Number.isFinite(body.importance) ? Math.max(0, Math.min(10, Number(body.importance))) : 1,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
  }

  const { data, error } = await admin.from("memory_entries").insert(payload).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  const admin = getAdmin()
  if (!admin) return NextResponse.json({ error: "Server not configured" }, { status: 503 })
  const owner = await resolveOwner(req, admin)
  if (!owner) return NextResponse.json({ error: "Missing identity" }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await admin.from("memory_entries").delete().eq("id", id).eq("owner_key", owner)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

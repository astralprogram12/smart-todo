import { type NextRequest, NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Helper to create the admin client
function getAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// MODIFIED: This function now ONLY resolves authenticated users.
// It no longer falls back to deviceId or web-guest.
async function resolveAuthenticatedUser(req: NextRequest, admin: SupabaseClient): Promise<string | null> {
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    try {
      const { data, error } = await admin.auth.getUser(token)
      if (!error && data.user) return data.user.id
    } catch {
      // Invalid token, fall through to return null
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ error: "Server not configured" }, { status: 503 })
  
  const userId = await resolveAuthenticatedUser(req, admin)
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  // Fetch all memory entries for the authenticated user
  const { data, error } = await admin
    .from("memory_entries")
    .select("*")
    // CHANGED: Use 'user_id' instead of 'owner_key'
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(200)
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ error: "Server not configured" }, { status: 503 })
  
  const userId = await resolveAuthenticatedUser(req, admin)
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const body = await req.json()
  const payload = {
    // CHANGED: Use 'user_id' instead of 'owner_key'
    user_id: userId,
    title: String(body.title ?? "Note"),
    content: body.content ? String(body.content) : null,
    importance: Number.isFinite(body.importance) ? Math.max(0, Math.min(10, Number(body.importance))) : 1,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
  }

  const { data, error } = await admin.from("memory_entries").insert(payload).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PUT(req: NextRequest) {
  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ error: "Server not configured" }, { status: 503 })

  const userId = await resolveAuthenticatedUser(req, admin)
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }
  
  const body = await req.json()
  const id = String(body.id ?? "")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const patch: any = {}
  if (body.title !== undefined) patch.title = String(body.title)
  if (body.content !== undefined) patch.content = body.content ? String(body.content) : null
  if (body.importance !== undefined) patch.importance = Math.max(0, Math.min(10, Number(body.importance)))
  if (body.tags !== undefined) patch.tags = Array.isArray(body.tags) ? body.tags.map(String) : []

  // Update the specified memory entry, ensuring it belongs to the authenticated user
  const { data, error } = await admin
    .from("memory_entries")
    .update(patch)
    .eq("id", id)
    // CHANGED: Use 'user_id' for security check
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ error: "Server not configured" }, { status: 503 })

  const userId = await resolveAuthenticatedUser(req, admin)
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }
  
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Delete the specified memory entry, ensuring it belongs to the authenticated user
  const { error } = await admin
    .from("memory_entries")
    .delete()
    .eq("id", id)
    // CHANGED: Use 'user_id' for security check
    .eq("user_id", userId)
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const { deviceId } = await req.json()
    const authHeader = req.headers.get("authorization")

    if (!deviceId || !authHeader?.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Missing deviceId or Authorization token" }, { status: 400 })
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("Migration Error: Supabase server not configured.")
      return NextResponse.json({ error: "Server not configured for migration" }, { status: 500 })
    }

    // Admin client (service role) to perform user verification and data updates
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { 
        persistSession: false, 
        autoRefreshToken: false 
      }
    })

    // Verify the caller's JWT to get their official user ID
    const token = authHeader.slice('Bearer '.length)
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)

    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 })
    }
    const userId = userData.user.id

    // A user cannot migrate data from their own ID to their ID.
    if (userId === deviceId) {
      return NextResponse.json({ migrated: false, reason: "User ID is the same as Device ID; nothing to migrate." })
    }

    console.log(`Attempting to migrate tasks from deviceId: ${deviceId} to userId: ${userId}`)

    // --- The Core Migration Logic ---
    const { error: tasksMigrationError } = await supabaseAdmin
      .from("tasks")
      // 1. Set the permanent user_id for the found tasks.
      .update({ user_id: userId })
      // 2. Find all tasks that belonged to the temporary deviceId.
      .eq("device_id", deviceId)
      // 3. IMPORTANT: Only update tasks that don't already have a user.
      .is("user_id", null)

    if (tasksMigrationError) {
      console.error("Task migration failed:", tasksMigrationError)
      return NextResponse.json({ error: "Failed to migrate tasks", details: tasksMigrationError.message }, { status: 500 })
    }

    console.log(`Successfully migrated tasks for user: ${userId}`)
    return NextResponse.json({ migrated: true })

  } catch (e: any) {
    console.error("Unknown migration error:", e.message)
    return NextResponse.json({ error: e?.message ?? "An unknown error occurred" }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    const normalizedEmail = String(email ?? "").trim().toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
        console.error("Server configuration error: Supabase URL or Service Key is missing.")
        return NextResponse.json({ error: "Server not configured" }, { status: 500 })
    }

    // Initialize the Admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // THE CORRECT METHOD: Use the admin auth function to look up a user by email.
    const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(normalizedEmail)

    // This is the crucial part: if there's an error, we need to check its message.
    if (error) {
      // A "User not found" error is the SUCCESS case for this endpoint. It means the email is available.
      if (error.message.toLowerCase().includes('user not found')) {
        return NextResponse.json({ exists: false })
      }
      
      // For any other unexpected errors, log them and return a server error.
      console.error("Supabase admin error checking email:", error.message)
      return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 })
    }

    // If there was NO error and we received data, it means the user exists.
    if (data?.user) {
      return NextResponse.json({ exists: true })
    }

    // As a final fallback, if there was no error and no data, the user doesn't exist.
    return NextResponse.json({ exists: false })

  } catch (e: any) {
    console.error("Catch block error:", e.message)
    return NextResponse.json({ error: e.message || 'An unknown error occurred' }, { status: 500 })
  }
}

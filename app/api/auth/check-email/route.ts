import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    const e = String(email ?? "")
      .trim()
      .toLowerCase()
    if (!e) return NextResponse.json({ error: "Missing email" }, { status: 400 })

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 })
    }

    // Query GoTrue Admin list users filtered by email
    // Docs: /auth/v1/admin/users?email=<email>
    const res = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(e)}`, {
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: "Admin API failed", details: text }, { status: 502 })
    }

    const data = (await res.json()) as any[]
    const exists = Array.isArray(data) && data.length > 0
    return NextResponse.json({ exists })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 })
  }
}

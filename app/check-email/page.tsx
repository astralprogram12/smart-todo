"use client"

import Link from "next/link"
import AppHeader from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { resolveWebmailUrl } from "@/lib/webmail"

const HIDE_WEBMAIL_LINK = false // set to true to remove the "Open webmail" action entirely

export default function CheckEmailPage() {
  const [detected, setDetected] = useState<{ url: string; provider: string } | null>(null)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const fromQuery = params.get("email")
      const stored = fromQuery || localStorage.getItem("last_signup_email") || ""
      if (stored) {
        setDetected(resolveWebmailUrl(stored))
      } else {
        setDetected(resolveWebmailUrl("gmail.com"))
      }
    } catch {
      setDetected(resolveWebmailUrl("gmail.com"))
    }
  }, [])

  return (
    <main className="min-h-screen bg-white">
      <AppHeader />
      <div className="mx-auto flex max-w-md justify-center px-4 py-10">
        <Card className="w-full border-[color:var(--brand)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl" style={{ color: "var(--secondary)" }}>
              Check your email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              We sent a confirmation link to your inbox. Click the link to verify your email. After confirmation, you
              can sign in to your account.
            </p>
            {detected && <p className="text-xs text-gray-500">Detected provider: {detected.provider}</p>}

            <div className="flex flex-wrap items-center gap-2">
              {!HIDE_WEBMAIL_LINK && detected && (
                <a
                  href={detected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md px-3 py-2 text-sm"
                  style={{ background: "var(--brand)", color: "var(--on-brand)", border: "1px solid var(--brand)" }}
                >
                  {`Open ${detected.provider} (new tab)`}
                </a>
              )}

              <Link
                href="/login"
                className="rounded-md border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
              >
                Back to login
              </Link>
            </div>

            {detected && <p className="text-[10px] text-gray-400 break-all">Target: {detected.url}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

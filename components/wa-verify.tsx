"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BadgeCheck, Phone, ShieldCheck, Lock } from "lucide-react"
import { getAuthHeaders } from "@/lib/identity"

type Status = {
  premium: boolean
  whatsapp: { phone: string | null; status: "disconnected" | "pending" | "connected" | "failed"; wa_connected: boolean }
}

const COUNTRY_PRESETS = [
  { code: "62", label: "Indonesia (+62)" },
  { code: "1", label: "United States (+1)" },
  { code: "44", label: "United Kingdom (+44)" },
  { code: "91", label: "India (+91)" },
  { code: "81", label: "Japan (+81)" },
]

export function WaVerify() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)

  const [step, setStep] = useState<"enter" | "code" | "done">("enter")
  const [countryCode, setCountryCode] = useState("62")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")

  const connected = status?.whatsapp?.wa_connected === true
  const premium = status?.premium === true

  useEffect(() => {
    refreshStatus()
  }, [])

  async function refreshStatus() {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const res = await fetch("/api/wa/status", { method: "GET", headers })
      const data = await res.json()
      if (res.ok) setStatus(data)
      else setStatus({ premium: false, whatsapp: { phone: null, status: "disconnected", wa_connected: false } })
    } finally {
      setLoading(false)
    }
  }

  async function sendCode() {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const res = await fetch("/api/wa/send", {
        method: "POST",
        headers,
        body: JSON.stringify({ countryCode, phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error ?? "Failed to send")
        return
      }
      setStep("code")
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const res = await fetch("/api/wa/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error ?? "Invalid code")
        return
      }
      await refreshStatus()
      setStep("done")
    } finally {
      setLoading(false)
    }
  }

  // Always render the button; for free users show a blocked dialog with a message.
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {connected ? (
          <Button variant="outline" className="bg-white" style={{ color: "var(--brand)", borderColor: "var(--brand)" }}>
            <BadgeCheck className="mr-2 h-4 w-4" />
            WhatsApp Connected
          </Button>
        ) : premium ? (
          <Button className="bg-[color:var(--brand)] text-[color:var(--on-brand)] hover:opacity-90">
            <Phone className="mr-2 h-4 w-4" />
            Verify WhatsApp
          </Button>
        ) : (
          <Button variant="outline" className="bg-white" style={{ color: "var(--brand)", borderColor: "var(--brand)" }}>
            <Lock className="mr-2 h-4 w-4" />
            Verify WhatsApp
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle style={{ color: "var(--secondary)" }}>
            {connected ? "WhatsApp Connected" : "Verify WhatsApp"}
          </DialogTitle>
        </DialogHeader>

        {!premium ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              {"This feature is still coming soon for free user but can be used for premium"}
            </p>
            <p className="text-xs text-gray-500">Sign in with a premium account to enable WhatsApp verification.</p>
          </div>
        ) : connected ? (
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--tertiary)", background: "#fff" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--secondary)" }}>
              <ShieldCheck className="h-4 w-4" style={{ color: "var(--brand)" }} />
              Your WhatsApp is connected. We’ll use it for premium notifications and verification.
            </div>
          </div>
        ) : step === "enter" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter your phone number to receive a verification code via WhatsApp.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="mb-1 block text-sm text-gray-700">Country</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-10 w-full rounded-md border px-2"
                  style={{ borderColor: "var(--tertiary)" }}
                >
                  {COUNTRY_PRESETS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm text-gray-700">Phone number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 8123456789"
                  className="bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">Do not include leading 0. We’ll pass the country code.</p>
              </div>
            </div>
          </div>
        ) : step === "code" ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Enter the 6-digit code we sent to your WhatsApp.</p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="bg-white"
              maxLength={6}
            />
          </div>
        ) : null}

        <DialogFooter className="mt-2">
          {!premium ? (
            <Button onClick={() => setOpen(false)} className="bg-[color:var(--brand)] text-[color:var(--on-brand)]">
              Close
            </Button>
          ) : connected ? (
            <Button onClick={() => setOpen(false)} className="bg-[color:var(--brand)] text-[color:var(--on-brand)]">
              Done
            </Button>
          ) : step === "enter" ? (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendCode} disabled={loading || !phone.trim()}>
                {loading ? "Sending…" : "Send code"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("enter")}>
                Back
              </Button>
              <Button onClick={verifyCode} disabled={loading || code.trim().length < 4}>
                {loading ? "Verifying…" : "Verify"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

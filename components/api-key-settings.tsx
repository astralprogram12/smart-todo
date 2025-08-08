"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound } from 'lucide-react'

const STORAGE_KEY = "GEMINI_API_KEY"

export function ApiKeySettings() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY) || ""
    setValue(v)
  }, [])

  function save() {
    localStorage.setItem(STORAGE_KEY, value.trim())
    // notify listeners (chat) to reconfigure transport headers
    window.dispatchEvent(new CustomEvent("gemini-key-updated"))
    setOpen(false)
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY)
    setValue("")
    window.dispatchEvent(new CustomEvent("gemini-key-updated"))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-white/20 bg-black text-white hover:bg-white/5">
          <KeyRound className="mr-2 h-4 w-4" />
          Gemini API
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{'Configure Gemini API Key'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm text-white/70" htmlFor="gemini-key">
            {'API Key'}
          </label>
          <Input
            id="gemini-key"
            placeholder="paste your Gemini API key"
            className="bg-black text-white placeholder:text-white/50"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <p className="text-xs text-white/60">
            {'The key is stored locally in your browser and sent as a header only to your app API.'}
          </p>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="ghost" className="text-white/80 hover:bg-white/5" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline" className="border-white/20 bg-black text-white hover:bg-white/10" onClick={clear}>
            Remove
          </Button>
          <Button className="border border-white/20 bg-white text-black hover:bg-white/90" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function getLocalGeminiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

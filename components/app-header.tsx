"use client"

import { ClipboardCheck, Github } from 'lucide-react'
import Link from "next/link"

export function AppHeader() {
  return (
    <header className="mx-auto max-w-7xl px-4 pb-6 pt-10 text-white">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/20 p-2">
            <ClipboardCheck className="h-6 w-6 text-violet-300" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{'SmartTask Chat'}</h1>
            <p className="text-white/70">{'Chat to add, organize, and complete your tasks'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/70">
          <Link href="https://vercel.com/templates" target="_blank" className="hover:text-white">
            {'Deploy'}
          </Link>
          <span className="opacity-40">{'·'}</span>
          <Link href="https://github.com" target="_blank" className="flex items-center gap-1 hover:text-white">
            <Github className="h-4 w-4" />
            {'Source'}
          </Link>
        </div>
      </div>
    </header>
  )
}

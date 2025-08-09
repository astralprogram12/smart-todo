"use client"

import { useEffect } from "react"
import { applyTheme } from "@/lib/theme"

export default function ThemeClient() {
  useEffect(() => {
    // Initialize from saved values or defaults
    try {
      const brand = localStorage.getItem("smart_theme_brand") ?? "#dc2626"
      const secondary = localStorage.getItem("smart_theme_secondary") ?? "#1f2937"
      const tertiary = localStorage.getItem("smart_theme_tertiary") ?? "#e5e7eb"
      applyTheme({ brand, secondary, tertiary, persist: false })
    } catch {
      applyTheme({ brand: "#dc2626", secondary: "#1f2937", tertiary: "#e5e7eb", persist: false })
    }

    // Listen for live updates from Settings modal
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { brand?: string; secondary?: string; tertiary?: string }
      applyTheme({ ...detail, persist: true })
    }
    window.addEventListener("theme:update", handler as EventListener)
    return () => window.removeEventListener("theme:update", handler as EventListener)
  }, [])
  return null
}

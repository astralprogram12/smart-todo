function getLuminance(hex: string) {
  const c = hex.replace("#", "")
  const r = Number.parseInt(c.substring(0, 2), 16) / 255
  const g = Number.parseInt(c.substring(2, 4), 16) / 255
  const b = Number.parseInt(c.substring(4, 6), 16) / 255
  const srgb = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function hexToRgb(hex: string) {
  const c = hex.replace("#", "")
  return {
    r: Number.parseInt(c.substring(0, 2), 16),
    g: Number.parseInt(c.substring(2, 4), 16),
    b: Number.parseInt(c.substring(4, 6), 16),
  }
}

function softTint(hex: string, alpha = 0.12) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function validHex(input: string, fallback: string) {
  const ok = /^#([A-Fa-f0-9]{3}){1,2}$/.test(input)
  return ok ? input : fallback
}

/**
 * Apply theme variables to :root.
 * opts.persist controls whether to store to localStorage.
 */
export function applyTheme(opts: { brand?: string; secondary?: string; tertiary?: string; persist?: boolean }) {
  const { persist } = opts
  const root = document.documentElement

  const current = {
    brand: validHex(opts.brand ?? localStorage.getItem("smart_theme_brand") ?? "#dc2626", "#dc2626"),
    secondary: validHex(opts.secondary ?? localStorage.getItem("smart_theme_secondary") ?? "#1f2937", "#1f2937"),
    tertiary: validHex(opts.tertiary ?? localStorage.getItem("smart_theme_tertiary") ?? "#e5e7eb", "#e5e7eb"),
  }

  const onBrand = getLuminance(current.brand) > 0.5 ? "#111111" : "#ffffff"
  const onTertiary = getLuminance(current.tertiary) > 0.5 ? "#111111" : "#111111" // keep text dark on soft surfaces

  root.style.setProperty("--brand", current.brand)
  root.style.setProperty("--on-brand", onBrand)
  root.style.setProperty("--brand-soft", softTint(current.brand, 0.14))

  root.style.setProperty("--secondary", current.secondary)
  root.style.setProperty("--secondary-soft", softTint(current.secondary, 0.14))

  root.style.setProperty("--tertiary", current.tertiary)
  root.style.setProperty("--on-tertiary", onTertiary)
  root.style.setProperty("--tertiary-soft", softTint(current.tertiary, 0.18))

  if (persist) {
    try {
      localStorage.setItem("smart_theme_brand", current.brand)
      localStorage.setItem("smart_theme_secondary", current.secondary)
      localStorage.setItem("smart_theme_tertiary", current.tertiary)
    } catch {}
  }
}

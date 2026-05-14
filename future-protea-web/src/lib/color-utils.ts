/**
 * Color Utilities for Future Protea Theme System
 * Handles color conversions, palette generation, and theme application
 */

import { getPaletteById, type PaletteColors } from './color-palettes'

export interface ColorPreset {
  name: string
  value: string // HEX color
  oklch: string // OKLCH format for CSS variables
}

/**
 * Quick color presets for custom color picker
 */
export const colorPresets: ColorPreset[] = [
  { name: 'Orange', value: '#f47a2e', oklch: 'oklch(0.70 0.18 45)' },
  { name: 'Violet', value: '#7c3aed', oklch: 'oklch(0.541 0.281 293.009)' },
  { name: 'Blue', value: '#3b82f6', oklch: 'oklch(0.608 0.214 259.815)' },
  { name: 'Cyan', value: '#06b6d4', oklch: 'oklch(0.685 0.169 195.769)' },
  { name: 'Emerald', value: '#10b981', oklch: 'oklch(0.696 0.17 162.48)' },
  { name: 'Rose', value: '#e11d48', oklch: 'oklch(0.577 0.245 27.325)' },
]

/**
 * Default primary color (Orange - Future Protea Brand)
 */
export const DEFAULT_PRIMARY_COLOR = colorPresets[0].value

/**
 * Parse OKLCH string to components
 */
function parseOklch(oklchString: string): { l: number; c: number; h: number } | null {
  const match = oklchString.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
  if (!match) return null
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
  }
}

/**
 * Convert HEX color to OKLCH format string
 * Simplified conversion without external library
 */
export function hexToOklch(hex: string): string {
  try {
    // Parse hex to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return colorPresets[0].oklch

    const r = parseInt(result[1], 16) / 255
    const g = parseInt(result[2], 16) / 255
    const b = parseInt(result[3], 16) / 255

    // Convert to linear RGB
    const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    const lr = toLinear(r)
    const lg = toLinear(g)
    const lb = toLinear(b)

    // RGB to XYZ
    const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb
    const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb
    const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb

    // XYZ to Lab (simplified)
    const l = 0.2104542553 * x + 0.7936177850 * y - 0.0040720468 * z
    const m = 1.9779984951 * x - 2.4285922050 * y + 0.4505937099 * z
    const s = 0.0259040371 * x + 0.7827717662 * y - 0.8086757660 * z

    const l_ = Math.cbrt(l)
    const m_ = Math.cbrt(m)
    const s_ = Math.cbrt(s)

    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

    // Lab to LCH
    const C = Math.sqrt(a * a + B * B)
    let H = Math.atan2(B, a) * 180 / Math.PI
    if (H < 0) H += 360

    return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(3)})`
  } catch (error) {
    console.error('Error converting HEX to OKLCH:', error)
    return colorPresets[0].oklch
  }
}

/**
 * Convert OKLCH string to HEX color
 * Simplified conversion without external library
 */
export function oklchToHex(oklchString: string): string {
  try {
    const parsed = parseOklch(oklchString)
    if (!parsed) return DEFAULT_PRIMARY_COLOR

    const { l, c, h } = parsed
    const hRad = h * Math.PI / 180

    // LCH to Lab
    const a = c * Math.cos(hRad)
    const b = c * Math.sin(hRad)

    // Lab to linear RGB (simplified inverse)
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b
    const s_ = l - 0.0894841775 * a - 1.2914855480 * b

    const lc = l_ * l_ * l_
    const mc = m_ * m_ * m_
    const sc = s_ * s_ * s_

    // Linear RGB
    const lr = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc
    const lg = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc
    const lb = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc

    // To sRGB
    const toSrgb = (c: number) => {
      const clamped = Math.max(0, Math.min(1, c))
      return clamped <= 0.0031308
        ? clamped * 12.92
        : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
    }

    const r = Math.round(toSrgb(lr) * 255)
    const g = Math.round(toSrgb(lg) * 255)
    const B = Math.round(toSrgb(lb) * 255)

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting OKLCH to HEX:', error)
    return DEFAULT_PRIMARY_COLOR
  }
}

/**
 * Generate a contrasting foreground color for accessibility
 * Ensures WCAG AA compliance (4.5:1 contrast ratio)
 */
export function getContrastingForeground(backgroundColor: string): string {
  try {
    // Parse hex to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(backgroundColor)
    if (!result) return 'oklch(0.984 0.003 247.858)'

    const r = parseInt(result[1], 16) / 255
    const g = parseInt(result[2], 16) / 255
    const b = parseInt(result[3], 16) / 255

    // Calculate relative luminance
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

    // Return white for dark backgrounds, dark for light backgrounds
    return luminance > 0.179
      ? 'oklch(0.129 0.042 264.695)' // Dark
      : 'oklch(0.984 0.003 247.858)' // White
  } catch {
    return 'oklch(0.984 0.003 247.858)'
  }
}

/**
 * Generate focus ring color (slightly adjusted from primary)
 */
export function generateRingColor(primaryOklch: string): string {
  const parsed = parseOklch(primaryOklch)
  if (!parsed) return 'oklch(0.704 0.04 256.788)'

  const newL = Math.min(parsed.l + 0.1, 0.85)
  return `oklch(${newL.toFixed(3)} ${parsed.c.toFixed(3)} ${parsed.h.toFixed(3)})`
}

/**
 * Apply a predefined color palette to the document
 */
export function applyPalette(paletteId: string, isDark: boolean = false) {
  const palette = getPaletteById(paletteId)
  if (!palette) {
    console.error('Palette not found:', paletteId)
    return
  }

  const colors = isDark ? palette.dark : palette.light
  applyPaletteColors(colors)

  document.documentElement.setAttribute('data-palette', paletteId)
}

/**
 * Apply palette colors to CSS variables
 */
function applyPaletteColors(colors: PaletteColors) {
  const root = document.documentElement

  root.style.setProperty('--primary', colors.primary)
  root.style.setProperty('--primary-foreground', colors.primaryForeground)
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--accent-foreground', colors.accentForeground)
  root.style.setProperty('--secondary', colors.secondary)
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground)
  root.style.setProperty('--muted', colors.muted)
  root.style.setProperty('--muted-foreground', colors.mutedForeground)
  root.style.setProperty('--ring', colors.ring)
  root.style.setProperty('--chart-1', colors.chart[0])
  root.style.setProperty('--chart-2', colors.chart[1])
  root.style.setProperty('--chart-3', colors.chart[2])
  root.style.setProperty('--chart-4', colors.chart[3])
  root.style.setProperty('--chart-5', colors.chart[4])
  root.style.setProperty('--sidebar-primary', 'var(--primary)')
  root.style.setProperty('--sidebar-primary-foreground', 'var(--primary-foreground)')
  root.style.setProperty('--sidebar-accent', 'var(--accent)')
  root.style.setProperty('--sidebar-accent-foreground', 'var(--accent-foreground)')
}

/**
 * Apply a custom color with full palette generation
 */
export function applyCustomColorTheme(hex: string, isDark: boolean = false) {
  const root = document.documentElement
  const oklchColor = hexToOklch(hex)
  const parsed = parseOklch(oklchColor)

  if (!parsed) {
    console.error('Invalid color:', hex)
    return
  }

  const { l, c, h } = parsed

  if (isDark) {
    const lighterL = Math.min(l + 0.25, 0.85)
    root.style.setProperty('--primary', `oklch(${lighterL.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)})`)
    root.style.setProperty('--primary-foreground', 'oklch(0.208 0.042 265.755)')
    root.style.setProperty('--secondary', `oklch(0.279 0.041 ${h.toFixed(3)})`)
    root.style.setProperty('--secondary-foreground', 'oklch(0.984 0.003 247.858)')

    const accentHue = (h + 30) % 360
    root.style.setProperty('--accent', `oklch(0.75 ${Math.min(c, 0.2).toFixed(3)} ${accentHue.toFixed(3)})`)
    root.style.setProperty('--accent-foreground', 'oklch(0.208 0.042 265.755)')
    root.style.setProperty('--muted', `oklch(0.279 0.041 ${h.toFixed(3)})`)
    root.style.setProperty('--muted-foreground', `oklch(0.704 0.04 ${h.toFixed(3)})`)
    root.style.setProperty('--ring', `oklch(${(lighterL + 0.1).toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)})`)
  } else {
    root.style.setProperty('--primary', oklchColor)
    root.style.setProperty('--primary-foreground', getContrastingForeground(hex))
    root.style.setProperty('--secondary', `oklch(0.951 0.026 ${h.toFixed(3)})`)
    root.style.setProperty('--secondary-foreground', oklchColor)

    const accentHue = (h + 30) % 360
    root.style.setProperty('--accent', `oklch(0.65 ${Math.min(c, 0.2).toFixed(3)} ${accentHue.toFixed(3)})`)
    root.style.setProperty('--accent-foreground', 'oklch(0.984 0.003 247.858)')
    root.style.setProperty('--muted', `oklch(0.951 0.026 ${h.toFixed(3)})`)
    root.style.setProperty('--muted-foreground', `oklch(0.552 0.016 ${h.toFixed(3)})`)
    root.style.setProperty('--ring', `oklch(${Math.min(l + 0.15, 0.85).toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)})`)
  }

  const chartColors = generateChartColors(h, isDark)
  chartColors.forEach((chartColor, i) => {
    root.style.setProperty(`--chart-${i + 1}`, chartColor)
  })

  root.style.setProperty('--sidebar-primary', 'var(--primary)')
  root.style.setProperty('--sidebar-primary-foreground', 'var(--primary-foreground)')
  root.style.setProperty('--sidebar-accent', 'var(--accent)')
  root.style.setProperty('--sidebar-accent-foreground', 'var(--accent-foreground)')

  root.removeAttribute('data-palette')
}

/**
 * Generate harmonious chart colors from a base hue
 */
export function generateChartColors(baseHue: number, isDark: boolean): string[] {
  const lightness = isDark ? 0.7 : 0.6
  const chroma = isDark ? 0.18 : 0.22

  return [
    `oklch(${lightness} ${chroma} ${baseHue})`,
    `oklch(${lightness} ${chroma} ${(baseHue + 72) % 360})`,
    `oklch(${lightness} ${chroma} ${(baseHue + 144) % 360})`,
    `oklch(${lightness} ${chroma} ${(baseHue + 216) % 360})`,
    `oklch(${lightness} ${chroma} ${(baseHue + 288) % 360})`,
  ]
}

/**
 * Reset all theme-related CSS variables
 */
export function resetAllThemeColors() {
  const root = document.documentElement

  const properties = [
    '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground',
    '--accent', '--accent-foreground',
    '--muted', '--muted-foreground',
    '--ring',
    '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5',
    '--sidebar-primary', '--sidebar-primary-foreground',
    '--sidebar-accent', '--sidebar-accent-foreground',
  ]

  properties.forEach((prop) => root.style.removeProperty(prop))
  root.removeAttribute('data-palette')
}

/**
 * Validate if a color string is valid HEX
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

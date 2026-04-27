import { Color } from 'cesium'

export const SECTOR_COLORS: Record<string, string> = {
  Emergency:          '#e63946',
  Health:             '#2a9d8f',
  Education:          '#457b9d',
  Climate:            '#52b788',
  Environment:        '#40916c',
  'Economic Dev':     '#f4a261',
  'Gov & Civil Society': '#a8dadc',
  Other:              '#adb5bd',
}

export const DELTA_COLOR_RAMPS = {
  positive: ['#86efac', '#22c55e'],
  negative: ['#f87171', '#dc2626'],
  neutral: ['#94a3b8', '#64748b'],
} as const

export function getSectorColorHex(sector: string): string {
  return SECTOR_COLORS[sector] ?? SECTOR_COLORS.Other
}

export function getSectorArcColors(sector: string): [string, string] {
  const color = getSectorColorHex(sector)
  return [color, color]
}

export function sectorColor(sector: string): Color {
  return Color.fromCssColorString(getSectorColorHex(sector))
}

// growth_rate: positive = green, negative = red, null/0 = gray
export function growthRateColor(rate: number | null): Color {
  if (rate === null) return Color.fromCssColorString('#9ca3af').withAlpha(0.6)
  if (rate > 0.1)  return Color.fromCssColorString('#22c55e').withAlpha(0.8)
  if (rate > 0)    return Color.fromCssColorString('#86efac').withAlpha(0.7)
  if (rate < -0.1) return Color.fromCssColorString('#ef4444').withAlpha(0.8)
  if (rate < 0)    return Color.fromCssColorString('#fca5a5').withAlpha(0.7)
  return Color.fromCssColorString('#9ca3af').withAlpha(0.6)
}

// credibility_score: 0→1, blue scale
export function credibilityColor(score: number): Color {
  const clamped = Math.max(0, Math.min(1, score))
  const r = Math.round(255 * (1 - clamped * 0.8))
  const g = Math.round(255 * (1 - clamped * 0.5))
  const b = 255
  return Color.fromBytes(r, g, b, 200)
}

// arc thickness: log scale capped at 8px
export function arcWidth(usd_m: number): number {
  return Math.max(1, Math.min(8, 1 + Math.log10(usd_m + 1) * 2.5))
}

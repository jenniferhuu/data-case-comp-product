import type { Flow } from '../types'

export interface FilterParams {
  yearSelection: number | 'all' | 'compare'
  donorCountry: string | null
  sector: string | null
  flowSizeMin: number
  compareYears?: [number, number]
}

export function applyFilters(flows: Flow[], params: FilterParams): Flow[] {
  return flows.filter((f) => {
    if (params.yearSelection !== 'all' && params.yearSelection !== 'compare') {
      if (f.year !== params.yearSelection) return false
    }
    if (params.yearSelection === 'compare' && params.compareYears) {
      const [y1, y2] = params.compareYears
      if (f.year !== y1 && f.year !== y2) return false
    }
    if (params.donorCountry && f.donor_country !== params.donorCountry) return false
    if (params.sector && f.top_sector !== params.sector) return false
    if (f.usd_disbursed_m < params.flowSizeMin) return false
    return true
  })
}

export interface LeaderboardEntry {
  id: string
  name: string
  total_usd_m: number
  n_flows: number
}

export function getLeaderboardDonors(flows: Flow[], topN: number): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>()
  for (const f of flows) {
    const existing = map.get(f.donor_id)
    if (existing) {
      existing.total_usd_m += f.usd_disbursed_m
      existing.n_flows += 1
    } else {
      map.set(f.donor_id, { id: f.donor_id, name: f.donor_name, total_usd_m: f.usd_disbursed_m, n_flows: 1 })
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.total_usd_m - a.total_usd_m)
    .slice(0, topN)
}

export function getLeaderboardCountries(flows: Flow[], topN: number): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>()
  for (const f of flows) {
    const existing = map.get(f.recipient_iso3)
    if (existing) {
      existing.total_usd_m += f.usd_disbursed_m
      existing.n_flows += 1
    } else {
      map.set(f.recipient_iso3, { id: f.recipient_iso3, name: f.recipient_name, total_usd_m: f.usd_disbursed_m, n_flows: 1 })
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.total_usd_m - a.total_usd_m)
    .slice(0, topN)
}

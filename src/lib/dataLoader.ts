import type { AppData } from '../types'

let cache: AppData | null = null

export async function loadAppData(): Promise<AppData> {
  if (cache) return cache
  const [flows, donors, countries, markers, geo, crisisEvents, filterOptions] =
    await Promise.all([
      fetch('/data/flows_by_year.json').then((r) => r.json()),
      fetch('/data/donor_summary.json').then((r) => r.json()),
      fetch('/data/country_summary.json').then((r) => r.json()),
      fetch('/data/marker_breakdown.json').then((r) => r.json()),
      fetch('/data/countries_geo.json').then((r) => r.json()),
      fetch('/data/crisis_events.json').then((r) => r.json()),
      fetch('/data/filter_options.json').then((r) => r.json()),
    ])
  cache = { flows, donors, countries, markers, geo, crisisEvents, filterOptions }
  return cache
}

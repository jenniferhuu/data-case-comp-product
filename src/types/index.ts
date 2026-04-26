export type Mode = 'crisis' | 'credibility'

export type YearSelection = number | 'all' | 'compare'

export type MarkerKey =
  | 'gender'
  | 'climate_mitigation'
  | 'climate_adaptation'
  | 'environment'
  | 'biodiversity'
  | 'desertification'
  | 'nutrition'

export const MARKER_LABELS: Record<MarkerKey, string> = {
  gender: 'Gender Equality',
  climate_mitigation: 'Climate Mitigation',
  climate_adaptation: 'Climate Adaptation',
  environment: 'Environment',
  biodiversity: 'Biodiversity',
  desertification: 'Desertification',
  nutrition: 'Nutrition',
}

export const ALL_MARKERS: MarkerKey[] = [
  'gender', 'climate_mitigation', 'climate_adaptation',
  'environment', 'biodiversity', 'desertification', 'nutrition',
]

export interface Country {
  iso3: string
  name: string
  lat: number
  lon: number
  continent: string
}

export interface Flow {
  year: number
  donor_id: string
  donor_name: string
  donor_country: string    // full name e.g. "United Kingdom"
  recipient_iso3: string
  recipient_name: string
  usd_disbursed_m: number
  n_projects: number
  top_sector: string
  growth_rate: number | null
}

export interface FlowsData {
  years: number[]
  flows: Flow[]
}

export interface SectorAmount {
  name: string
  usd_m: number
}

export interface RecipientAmount {
  iso3: string
  name: string
  usd_m: number
}

export interface DonorAmount {
  donor_id: string
  donor_name: string
  usd_m: number
}

export interface DonorSummary {
  donor_id: string
  donor_name: string
  donor_country: string    // full name e.g. "United Kingdom"
  donor_iso3: string       // ISO3 code e.g. "GBR" — for arc coordinate lookup
  total_usd_m: number
  n_projects: number
  n_countries: number
  rank: number | null
  top_sectors: SectorAmount[]
  top_recipients: RecipientAmount[]
  year_range: [number, number]
}

export interface CountrySummary {
  iso3: string
  name: string
  total_received_usd_m: number
  n_donors: number
  n_projects: number
  top_donors: DonorAmount[]
  top_sectors: SectorAmount[]
  by_year: Record<string, number>
}

export interface MarkerStats {
  screened_pct: number
  principal_pct: number
  significant_pct: number
  not_targeted_pct: number
  credibility_score: number
}

export interface MarkerBreakdown {
  donor_id: string
  donor_name: string
  markers: Record<MarkerKey, MarkerStats>
}

export interface CrisisEvent {
  id: string
  name: string
  year: number
  country_iso3: string | null
  lat: number | null
  lon: number | null
  description: string
  highlight_color: string
}

export interface FilterOptions {
  donor_countries: string[]
  sectors: string[]
  year_min: number
  year_max: number
  markers: MarkerKey[]
}

export interface AppData {
  flows: FlowsData
  donors: DonorSummary[]
  countries: CountrySummary[]
  markers: MarkerBreakdown[]
  geo: Country[]
  crisisEvents: CrisisEvent[]
  filterOptions: FilterOptions
}

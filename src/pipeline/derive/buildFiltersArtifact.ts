import { ALL_MARKERS, type MarkerKey } from '../../types'
import type { CanonicalFundingRow } from '../normalize/normalizeRows'

export interface FiltersArtifact {
  donorCountries: string[]
  sectors: string[]
  years: number[]
  markers: MarkerKey[]
}

export function buildFiltersArtifact(rows: CanonicalFundingRow[]): FiltersArtifact {
  const donorCountries = [...new Set(rows.map((row) => row.donor.country))].sort((a, b) => a.localeCompare(b))
  const sectors = [...new Set(rows.map((row) => row.sector))].sort((a, b) => a.localeCompare(b))
  const years = [...new Set(rows.map((row) => row.year).filter((year) => Number.isInteger(year) && year > 0))].sort(
    (a, b) => a - b,
  )

  return {
    donorCountries,
    sectors,
    years,
    markers: [...ALL_MARKERS],
  }
}

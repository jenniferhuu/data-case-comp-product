import { ALL_MARKERS, type MarkerKey } from '../../types'
import type { GeoCountry } from '../../components/Globe/globePresentation'
import type { CanonicalFundingRow } from '../normalize/normalizeRows'

function normalizeGeoKey(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

export interface FiltersArtifact {
  donors: string[]
  donorCountries: string[]
  recipientCountries: string[]
  sectors: string[]
  years: number[]
  markers: MarkerKey[]
  donorIdMap: Record<string, string>
  recipientCountryIsoMap: Record<string, string>
}

export function buildFiltersArtifact(rows: CanonicalFundingRow[], geo: GeoCountry[] = []): FiltersArtifact {
  const donors = [...new Set(rows.map((row) => row.donor.name))].sort((a, b) => a.localeCompare(b))
  const donorCountries = [...new Set(rows.map((row) => row.donor.country))].sort((a, b) => a.localeCompare(b))
  const recipientCountries = [...new Set(rows.map((row) => row.recipient.name))].sort((a, b) => a.localeCompare(b))
  const sectors = [...new Set(rows.map((row) => row.sector))].sort((a, b) => a.localeCompare(b))
  const years = [...new Set(rows.map((row) => row.year).filter((year) => Number.isInteger(year) && year > 0))].sort(
    (a, b) => a - b,
  )

  const donorIdMap: Record<string, string> = {}
  for (const row of rows) {
    if (!(row.donor.name in donorIdMap)) {
      donorIdMap[row.donor.name] = row.donor.id
    }
  }

  const geoByName = new Map<string, string>()
  for (const entry of geo) {
    geoByName.set(normalizeGeoKey(entry.name), entry.iso3)
  }

  const recipientCountryIsoMap: Record<string, string> = {}
  for (const row of rows) {
    const name = row.recipient.name
    if (name in recipientCountryIsoMap) continue
    const iso3 = row.recipient.iso3 !== 'UNK'
      ? row.recipient.iso3
      : geoByName.get(normalizeGeoKey(name))
    if (iso3 !== undefined) {
      recipientCountryIsoMap[name] = iso3
    }
  }

  return {
    donors,
    donorCountries,
    recipientCountries,
    sectors,
    years,
    markers: [...ALL_MARKERS],
    donorIdMap,
    recipientCountryIsoMap,
  }
}

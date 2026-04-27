import type { DrilldownResponse } from '../../contracts/drilldown'
import type { CanonicalFundingRow } from '../normalize/normalizeRows'

interface DonorAggregate {
  id: string
  name: string
  country: string
  totalUsdM: number
}

interface CountryAggregate {
  iso3: string
  name: string
  totalUsdM: number
}

export interface DrilldownsArtifact {
  donors: DonorAggregate[]
  countries: CountryAggregate[]
  defaultSelection: DrilldownResponse
}

function getRecipientGroupKey(row: CanonicalFundingRow): string {
  return row.recipient.iso3 === 'UNK'
    ? `name:${row.recipient.name.trim().toLowerCase()}`
    : `iso3:${row.recipient.iso3}`
}

export function buildDrilldownArtifact(rows: CanonicalFundingRow[]): DrilldownsArtifact {
  const donorMap = new Map<string, DonorAggregate>()
  const countryMap = new Map<string, CountryAggregate>()

  for (const row of rows) {
    const donor = donorMap.get(row.donor.id) ?? {
      id: row.donor.id,
      name: row.donor.name,
      country: row.donor.country,
      totalUsdM: 0,
    }
    donor.totalUsdM += row.amountUsdM
    donorMap.set(row.donor.id, donor)

    const countryKey = getRecipientGroupKey(row)
    const country = countryMap.get(countryKey) ?? {
      iso3: row.recipient.iso3,
      name: row.recipient.name,
      totalUsdM: 0,
    }
    country.totalUsdM += row.amountUsdM
    countryMap.set(countryKey, country)
  }

  return {
    donors: [...donorMap.values()].sort((a, b) => b.totalUsdM - a.totalUsdM || a.name.localeCompare(b.name)),
    countries: [...countryMap.values()].sort((a, b) => b.totalUsdM - a.totalUsdM || a.name.localeCompare(b.name)),
    defaultSelection: {
      donor: null,
      country: null,
    },
  }
}

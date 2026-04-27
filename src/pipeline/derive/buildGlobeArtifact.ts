import type { GlobeResponse } from '../../contracts/globe'
import type { CanonicalFundingRow } from '../normalize/normalizeRows'

export function buildGlobeArtifact(rows: CanonicalFundingRow[]): GlobeResponse {
  return {
    flows: rows.map((row) => ({
      donorId: row.donor.id,
      donorName: row.donor.name,
      donorCountry: row.donor.country,
      recipientIso3: row.recipient.iso3,
      recipientName: row.recipient.name,
      year: row.year,
      amountUsdM: row.amountUsdM,
      sector: row.sector,
    })),
  }
}

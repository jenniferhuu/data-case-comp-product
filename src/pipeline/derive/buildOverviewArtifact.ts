import type { OverviewResponse } from '../../contracts/overview'
import type { CanonicalFundingRow } from '../normalize/normalizeRows'

function getRecipientGroupKey(row: CanonicalFundingRow): string {
  return row.recipient.iso3 === 'UNK'
    ? `name:${row.recipient.name.trim().toLowerCase()}`
    : `iso3:${row.recipient.iso3}`
}

export function buildOverviewArtifact(rows: CanonicalFundingRow[]): OverviewResponse {
  const fundingUsdM = rows.reduce((sum, row) => sum + row.disbursementsUsdM, 0)
  const disbursementsUsdM = rows.reduce((sum, row) => sum + Math.max(0, row.disbursementsUsdM), 0)
  const commitmentsUsdM = rows.reduce((sum, row) => sum + Math.max(0, row.commitmentsUsdM), 0)
  const donors = new Set(rows.map((row) => row.donor.id)).size
  const countries = new Set(rows.map((row) => getRecipientGroupKey(row))).size
  const corridors = new Set(rows.map((row) => `${row.donor.id}:${getRecipientGroupKey(row)}`)).size

  return {
    totals: {
      fundingUsdM,
      donors,
      countries,
      corridors,
    },
    highlights: [],
    topSectors: [],
    topRecipients: [],
    topDonors: [],
    yearlyFunding: [],
    modalityBreakdown: [],
    commitmentProgress: {
      disbursedPct: commitmentsUsdM > 0 ? Number(((disbursementsUsdM / commitmentsUsdM) * 100).toFixed(1)) : 0,
    },
  }
}

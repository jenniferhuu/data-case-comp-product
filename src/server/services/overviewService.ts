import { overviewResponseSchema, type OverviewResponse } from '../../contracts/overview'
import { normalizeSectorLabel } from '../../lib/sectorLabels'
import type { CanonicalFundingRow } from '../../pipeline/normalize/normalizeRows'
import { getRowAmount, classifyFinancialInstrument, loadFilteredRows } from './dashboardData'

function round4(value: number) {
  return Number(value.toFixed(4))
}

function getRecipientGroupKey(row: CanonicalFundingRow): string {
  return row.recipient.iso3 === 'UNK'
    ? `name:${row.recipient.name.trim().toLowerCase()}`
    : `iso3:${row.recipient.iso3}`
}

export async function getOverview(searchParams?: URLSearchParams): Promise<OverviewResponse> {
  const { query, rows } = await loadFilteredRows(searchParams)
  const donorTotals = new Map<string, { id: string; label: string; country: string; totalUsdM: number }>()
  const recipientTotals = new Map<string, { id?: string; label: string; totalUsdM: number }>()
  const sectorTotals = new Map<string, number>()
  const yearlyTotals = new Map<number, number>()
  const modalityTotals = new Map<'Grants' | 'Loans', number>([
    ['Grants', 0],
    ['Loans', 0],
  ])
  let fundingUsdM = 0
  let filteredDisbursementsUsdM = 0
  let filteredCommitmentsUsdM = 0

  for (const row of rows) {
    const amount = getRowAmount(row, query.valueMode)
    filteredDisbursementsUsdM += Math.max(0, row.disbursementsUsdM)
    filteredCommitmentsUsdM += Math.max(0, row.commitmentsUsdM)
    if (amount <= 0) {
      continue
    }

    fundingUsdM += amount

    const donor = donorTotals.get(row.donor.id) ?? {
      id: row.donor.id,
      label: row.donor.name,
      country: row.donor.country,
      totalUsdM: 0,
    }
    donor.totalUsdM += amount
    donorTotals.set(row.donor.id, donor)

    const recipientKey = getRecipientGroupKey(row)
    const recipient = recipientTotals.get(recipientKey) ?? {
      id: row.recipient.iso3 === 'UNK' ? undefined : row.recipient.iso3,
      label: row.recipient.name,
      totalUsdM: 0,
    }
    recipient.totalUsdM += amount
    recipientTotals.set(recipientKey, recipient)

    const sector = normalizeSectorLabel(row.sector)
    sectorTotals.set(sector, (sectorTotals.get(sector) ?? 0) + amount)
    yearlyTotals.set(row.year, (yearlyTotals.get(row.year) ?? 0) + amount)

    const modality = classifyFinancialInstrument(row.financialInstrument) === 'loan' ? 'Loans' : 'Grants'
    modalityTotals.set(modality, (modalityTotals.get(modality) ?? 0) + amount)
  }

  const totals = {
    fundingUsdM: round4(fundingUsdM),
    donors: donorTotals.size,
    countries: recipientTotals.size,
    corridors: new Set(
      rows
        .filter((row) => getRowAmount(row, query.valueMode) > 0)
        .map((row) => `${row.donor.id}:${getRecipientGroupKey(row)}`),
    ).size,
  }

  const sortedTopDonors = [...donorTotals.values()]
    .sort((left, right) => right.totalUsdM - left.totalUsdM || left.label.localeCompare(right.label))
    .slice(0, 30)
    .map((donor) => ({
      id: donor.id,
      label: donor.label,
      totalUsdM: round4(donor.totalUsdM),
      country: donor.country,
    }))

  const disbursedPct = filteredCommitmentsUsdM > 0
    ? Number(((filteredDisbursementsUsdM / filteredCommitmentsUsdM) * 100).toFixed(1))
    : 0

  return overviewResponseSchema.parse({
    totals,
    highlights: sortedTopDonors[0] === undefined
      ? []
      : [{
          id: 'largest-donor',
          label: 'Largest donor',
          value: sortedTopDonors[0].label,
          tone: 'positive',
        }],
    topSectors: [...sectorTotals.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([label, totalUsdM]) => ({
        label,
        totalUsdM: round4(totalUsdM),
      })),
    topRecipients: [...recipientTotals.values()]
      .sort((left, right) => right.totalUsdM - left.totalUsdM || left.label.localeCompare(right.label))
      .slice(0, 6)
      .map((recipient) => ({
        id: recipient.id,
        label: recipient.label,
        totalUsdM: round4(recipient.totalUsdM),
      })),
    topDonors: sortedTopDonors,
    yearlyFunding: [...yearlyTotals.entries()]
      .filter(([year]) => year > 0)
      .sort((left, right) => left[0] - right[0])
      .map(([year, totalUsdM]) => ({
        year,
        totalUsdM: round4(totalUsdM),
      })),
    modalityBreakdown: ([
      { label: 'Grants', totalUsdM: modalityTotals.get('Grants') ?? 0 },
      { label: 'Loans', totalUsdM: modalityTotals.get('Loans') ?? 0 },
    ]).map((entry) => ({
      label: entry.label,
      totalUsdM: round4(entry.totalUsdM),
    })),
    commitmentProgress: {
      disbursedPct,
    },
  })
}

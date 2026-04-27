import { drilldownResponseSchema, type DrilldownResponse } from '../../contracts/drilldown'
import { normalizeSectorLabel } from '../../lib/sectorLabels'
import type { CanonicalFundingRow } from '../../pipeline/normalize/normalizeRows'
import { readCountriesGeoJson } from '../repositories/geoRepository'
import { getRowAmount, loadFilteredRows } from './dashboardData'

function round1(value: number) {
  return Number(value.toFixed(1))
}

function round4(value: number) {
  return Number(value.toFixed(4))
}

function getRecipientGroupKey(row: CanonicalFundingRow): string {
  return row.recipient.iso3 === 'UNK'
    ? `name:${row.recipient.name.trim().toLowerCase()}`
    : `iso3:${row.recipient.iso3}`
}

function sortTotals<T extends { totalUsdM: number }>(items: T[]) {
  return items.sort((left, right) => right.totalUsdM - left.totalUsdM)
}

function buildSectorBreakdown(rows: CanonicalFundingRow[], valueMode: 'disbursements' | 'commitments') {
  const totals = new Map<string, number>()

  for (const row of rows) {
    const amount = getRowAmount(row, valueMode)
    if (amount <= 0) continue
    const sector = normalizeSectorLabel(row.sector)
    totals.set(sector, (totals.get(sector) ?? 0) + amount)
  }

  return sortTotals(
    [...totals.entries()].map(([sector, totalUsdM]) => ({
      sector,
      totalUsdM: round4(totalUsdM),
    })),
  ).slice(0, 6)
}

function buildTopImplementers(rows: CanonicalFundingRow[], valueMode: 'disbursements' | 'commitments') {
  const totals = new Map<string, number>()

  for (const row of rows) {
    const amount = getRowAmount(row, valueMode)
    if (amount <= 0) continue
    totals.set(row.channelName, (totals.get(row.channelName) ?? 0) + amount)
  }

  return sortTotals(
    [...totals.entries()].map(([name, totalUsdM]) => ({
      name,
      totalUsdM: round4(totalUsdM),
    })),
  ).slice(0, 6)
}

function buildYearlyFunding(rows: CanonicalFundingRow[], valueMode: 'disbursements' | 'commitments') {
  const totals = new Map<number, number>()

  for (const row of rows) {
    const amount = getRowAmount(row, valueMode)
    if (row.year <= 0 || amount <= 0) continue
    totals.set(row.year, (totals.get(row.year) ?? 0) + amount)
  }

  return [...totals.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([year, totalUsdM]) => ({ year, totalUsdM: round4(totalUsdM) }))
}

export async function getDrilldown(searchParams?: URLSearchParams): Promise<DrilldownResponse> {
  const { query, rows } = await loadFilteredRows(searchParams)

  if (query.selectionType === 'donor' && query.selectionId !== undefined) {
    const donorRows = rows.filter((row) => row.donor.id === query.selectionId)
    const totalUsdM = donorRows.reduce((sum, row) => sum + getRowAmount(row, query.valueMode), 0)

    if (donorRows.length === 0 || totalUsdM <= 0) {
      return drilldownResponseSchema.parse({ donor: null, country: null, donorCountry: null })
    }

    const topRecipients = new Map<string, { iso3: string; name: string; totalUsdM: number }>()
    for (const row of donorRows) {
      const amount = getRowAmount(row, query.valueMode)
      if (amount <= 0) continue
      const key = getRecipientGroupKey(row)
      const existing = topRecipients.get(key) ?? {
        iso3: row.recipient.iso3,
        name: row.recipient.name,
        totalUsdM: 0,
      }
      existing.totalUsdM += amount
      topRecipients.set(key, existing)
    }

    const topRecipientEntries = sortTotals(
      [...topRecipients.values()].map((recipient) => ({
        ...recipient,
        totalUsdM: round4(recipient.totalUsdM),
      })),
    ).slice(0, 6)

    return drilldownResponseSchema.parse({
      donor: {
        id: query.selectionId,
        name: donorRows[0]!.donor.name,
        country: donorRows[0]!.donor.country,
        totalUsdM: round4(totalUsdM),
        recipientCount: topRecipients.size,
        topRecipientShare: round1(((topRecipientEntries[0]?.totalUsdM ?? 0) / totalUsdM) * 100),
        yearlyFunding: buildYearlyFunding(donorRows, query.valueMode),
        sectorBreakdown: buildSectorBreakdown(donorRows, query.valueMode),
        topRecipients: topRecipientEntries,
        topImplementers: buildTopImplementers(donorRows, query.valueMode),
      },
      country: null,
      donorCountry: null,
    })
  }

  if (query.selectionType === 'country' && query.selectionId !== undefined) {
    const geo = await readCountriesGeoJson()
    const selectedGeoName = geo.find((entry) => entry.iso3 === query.selectionId)?.name
    const countryRows = rows.filter((row) =>
      row.recipient.iso3 === query.selectionId
      || row.recipient.name === query.selectionId
      || (selectedGeoName !== undefined && row.recipient.name === selectedGeoName),
    )
    const totalUsdM = countryRows.reduce((sum, row) => sum + getRowAmount(row, query.valueMode), 0)

    if (countryRows.length === 0 || totalUsdM <= 0) {
      return drilldownResponseSchema.parse({ donor: null, country: null, donorCountry: null })
    }

    const topDonors = new Map<string, { id: string; name: string; country: string; totalUsdM: number }>()
    for (const row of countryRows) {
      const amount = getRowAmount(row, query.valueMode)
      if (amount <= 0) continue
      const existing = topDonors.get(row.donor.id) ?? {
        id: row.donor.id,
        name: row.donor.name,
        country: row.donor.country,
        totalUsdM: 0,
      }
      existing.totalUsdM += amount
      topDonors.set(row.donor.id, existing)
    }

    const topDonorEntries = sortTotals(
      [...topDonors.values()].map((donor) => ({
        ...donor,
        totalUsdM: round4(donor.totalUsdM),
      })),
    ).slice(0, 6)

    return drilldownResponseSchema.parse({
      donor: null,
      country: {
        iso3: countryRows[0]!.recipient.iso3 === 'UNK' ? query.selectionId : countryRows[0]!.recipient.iso3,
        name: countryRows[0]!.recipient.name,
        totalUsdM: round4(totalUsdM),
        donorCount: topDonors.size,
        topDonorShare: round1(((topDonorEntries[0]?.totalUsdM ?? 0) / totalUsdM) * 100),
        yearlyFunding: buildYearlyFunding(countryRows, query.valueMode),
        sectorBreakdown: buildSectorBreakdown(countryRows, query.valueMode),
        topDonors: topDonorEntries,
        topImplementers: buildTopImplementers(countryRows, query.valueMode),
      },
      donorCountry: null,
    })
  }

  if (query.selectionType === 'donorCountry' && query.selectionId !== undefined) {
    const donorCountryRows = rows.filter((row) => row.donor.country === query.selectionId)
    const totalUsdM = donorCountryRows.reduce((sum, row) => sum + getRowAmount(row, query.valueMode), 0)

    if (donorCountryRows.length === 0 || totalUsdM <= 0) {
      return drilldownResponseSchema.parse({ donor: null, country: null, donorCountry: null })
    }

    const donorTotals = new Map<string, { id: string; name: string; country: string; totalUsdM: number }>()
    const recipientTotals = new Map<string, { iso3: string; name: string; totalUsdM: number }>()

    for (const row of donorCountryRows) {
      const amount = getRowAmount(row, query.valueMode)
      if (amount <= 0) continue

      const donor = donorTotals.get(row.donor.id) ?? {
        id: row.donor.id,
        name: row.donor.name,
        country: row.donor.country,
        totalUsdM: 0,
      }
      donor.totalUsdM += amount
      donorTotals.set(row.donor.id, donor)

      const recipientKey = getRecipientGroupKey(row)
      const recipient = recipientTotals.get(recipientKey) ?? {
        iso3: row.recipient.iso3,
        name: row.recipient.name,
        totalUsdM: 0,
      }
      recipient.totalUsdM += amount
      recipientTotals.set(recipientKey, recipient)
    }

    return drilldownResponseSchema.parse({
      donor: null,
      country: null,
      donorCountry: {
        name: query.selectionId,
        totalUsdM: round4(totalUsdM),
        donorCount: donorTotals.size,
        topDonors: sortTotals(
          [...donorTotals.values()].map((donor) => ({
            ...donor,
            totalUsdM: round4(donor.totalUsdM),
          })),
        ).slice(0, 8),
        sectorBreakdown: buildSectorBreakdown(donorCountryRows, query.valueMode),
        yearlyFunding: buildYearlyFunding(donorCountryRows, query.valueMode),
        topRecipients: sortTotals(
          [...recipientTotals.values()].map((recipient) => ({
            ...recipient,
            totalUsdM: round4(recipient.totalUsdM),
          })),
        ).slice(0, 6),
        topImplementers: buildTopImplementers(donorCountryRows, query.valueMode),
      },
    })
  }

  return drilldownResponseSchema.parse({ donor: null, country: null, donorCountry: null })
}

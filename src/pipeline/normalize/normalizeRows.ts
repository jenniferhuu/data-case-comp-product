import { resolveCountry, type CanonicalRecipient } from './resolveCountry'
import { resolveDonor, type CanonicalDonor } from './resolveDonor'

export interface CanonicalFundingRow {
  year: number
  amountUsdM: number
  sector: string
  donor: CanonicalDonor
  recipient: CanonicalRecipient
}

function normalizeText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function parseFiniteNumber(value: string | undefined): number {
  const normalized = normalizeText(value)
  if (!normalized) {
    return 0
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function firstNormalizedValue(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = normalizeText(value)
    if (normalized) {
      return normalized
    }
  }

  return undefined
}

export function normalizeRows(rows: Record<string, string>[]): CanonicalFundingRow[] {
  return rows.map((row) => ({
    year: parseFiniteNumber(row.year),
    amountUsdM: parseFiniteNumber(
      firstNormalizedValue(row.usd_disbursed, row.usd_disbursed_m, row.usd_disbursements_defl),
    ),
    sector: normalizeText(row.sector) ?? normalizeText(row.Sector) ?? 'Other',
    donor: resolveDonor(row),
    recipient: resolveCountry(row),
  }))
}

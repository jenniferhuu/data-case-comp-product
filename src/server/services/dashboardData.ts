import type { DashboardQuery } from '../../contracts/filters'
import type { CanonicalFundingRow } from '../../pipeline/normalize/normalizeRows'
import { dashboardQuerySchema } from '../../contracts/filters'
import { readFundingRows } from '../repositories/fundingRowsRepository'

export type ValueMode = DashboardQuery['valueMode']

export function parseDashboardQuery(searchParams?: URLSearchParams): DashboardQuery {
  if (searchParams === undefined) {
    return dashboardQuerySchema.parse({})
  }

  return dashboardQuerySchema.parse(Object.fromEntries(searchParams.entries()))
}

export function getRowAmount(row: CanonicalFundingRow, valueMode: ValueMode): number {
  return valueMode === 'commitments' ? row.commitmentsUsdM : row.disbursementsUsdM
}

export function classifyFinancialInstrument(value: string): 'grant' | 'loan' {
  return value.trim().toLowerCase().includes('loan') ? 'loan' : 'grant'
}

export function getFilteredRows(rows: CanonicalFundingRow[], query: DashboardQuery): CanonicalFundingRow[] {
  return rows.filter((row) => {
    if (query.yearMode === 'single' && query.year !== undefined && row.year !== query.year) {
      return false
    }

    if (
      query.yearMode === 'compare'
      && query.compareFrom !== undefined
      && query.compareTo !== undefined
      && row.year !== query.compareFrom
      && row.year !== query.compareTo
    ) {
      return false
    }

    if (query.donor !== undefined && row.donor.name !== query.donor) {
      return false
    }

    if (query.donorCountry !== undefined && row.donor.country !== query.donorCountry) {
      return false
    }

    if (query.recipientCountry !== undefined && row.recipient.name !== query.recipientCountry) {
      return false
    }

    if (query.sector !== undefined && row.sector !== query.sector) {
      return false
    }

    return true
  })
}

export async function loadFilteredRows(searchParams?: URLSearchParams) {
  const query = parseDashboardQuery(searchParams)
  const rows = await readFundingRows()
  return {
    query,
    rows: getFilteredRows(rows, query),
  }
}

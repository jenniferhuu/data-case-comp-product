import { loadPrimaryCsv } from '../../pipeline/loaders/loadPrimaryCsv'
import { normalizeRows, type CanonicalFundingRow } from '../../pipeline/normalize/normalizeRows'

let fundingRowsCache: CanonicalFundingRow[] | null = null

export async function readFundingRows(): Promise<CanonicalFundingRow[]> {
  if (fundingRowsCache !== null) {
    return fundingRowsCache
  }

  const rawRows = await loadPrimaryCsv()
  fundingRowsCache = normalizeRows(rawRows)
  return fundingRowsCache
}

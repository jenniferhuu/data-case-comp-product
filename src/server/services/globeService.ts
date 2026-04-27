import { globeResponseSchema, type GlobeResponse } from '../../contracts/globe'
import { readCountriesGeoJson } from '../repositories/geoRepository'
import { buildGlobePresentation } from '../../components/Globe/globePresentation'
import { getRowAmount, loadFilteredRows } from './dashboardData'

export async function getGlobeData(searchParams?: URLSearchParams): Promise<GlobeResponse> {
  const { query, rows } = await loadFilteredRows(searchParams)

  const flows = rows
    .map((row) => ({
      donorId: row.donor.id,
      donorName: row.donor.name,
      donorCountry: row.donor.country,
      recipientIso3: row.recipient.iso3,
      recipientName: row.recipient.name,
      year: row.year,
      amountUsdM: getRowAmount(row, query.valueMode),
      sector: row.sector,
    }))
    .filter((flow) => flow.amountUsdM > 0)

  const geo = await readCountriesGeoJson()
  return globeResponseSchema.parse(buildGlobePresentation(flows, geo))
}

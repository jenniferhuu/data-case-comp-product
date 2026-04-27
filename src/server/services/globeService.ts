import { dashboardQuerySchema } from '../../contracts/filters'
import { globeArtifactSchema, globeResponseSchema, type GlobeResponse } from '../../contracts/globe'
import { readArtifactJson } from '../repositories/artifactRepository'
import { readCountriesGeoJson } from '../repositories/geoRepository'
import { buildGlobePresentation } from '../../components/Globe/globePresentation'

function parseDashboardQuery(searchParams?: URLSearchParams) {
  if (searchParams === undefined) {
    return dashboardQuerySchema.parse({})
  }

  return dashboardQuerySchema.parse(Object.fromEntries(searchParams.entries()))
}

export async function getGlobeData(searchParams?: URLSearchParams): Promise<GlobeResponse> {
  const query = parseDashboardQuery(searchParams)
  const artifact = globeArtifactSchema.parse(await readArtifactJson('globe'))

  const flows = artifact.flows.filter((flow) => {
    if (query.yearMode === 'single' && query.year !== undefined && flow.year !== query.year) {
      return false
    }

    if (
      query.yearMode === 'compare'
      && query.compareFrom !== undefined
      && query.compareTo !== undefined
      && flow.year !== query.compareFrom
      && flow.year !== query.compareTo
    ) {
      return false
    }

    if (query.donor !== undefined && flow.donorName !== query.donor) {
      return false
    }

    if (query.donorCountry !== undefined && flow.donorCountry !== query.donorCountry) {
      return false
    }

    if (query.recipientCountry !== undefined && flow.recipientName !== query.recipientCountry) {
      return false
    }

    if (query.sector !== undefined && flow.sector !== query.sector) {
      return false
    }

    return true
  })

  const geo = await readCountriesGeoJson()
  return globeResponseSchema.parse(buildGlobePresentation(flows, geo))
}

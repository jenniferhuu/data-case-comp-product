import { dashboardQuerySchema } from '../../contracts/filters'
import { globeResponseSchema, type GlobeResponse } from '../../contracts/globe'
import { readArtifactJson } from '../repositories/artifactRepository'

function parseDashboardQuery(searchParams?: URLSearchParams) {
  if (searchParams === undefined) {
    return dashboardQuerySchema.parse({})
  }

  return dashboardQuerySchema.parse(Object.fromEntries(searchParams.entries()))
}

export async function getGlobeData(searchParams?: URLSearchParams): Promise<GlobeResponse> {
  const query = parseDashboardQuery(searchParams)
  const artifact = globeResponseSchema.parse(await readArtifactJson('globe'))

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

    if (query.donorCountry !== undefined && flow.donorCountry !== query.donorCountry) {
      return false
    }

    if (query.sector !== undefined && flow.sector !== query.sector) {
      return false
    }

    return true
  })

  return {
    flows,
  }
}

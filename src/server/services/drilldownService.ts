import { dashboardQuerySchema } from '../../contracts/filters'
import { drilldownResponseSchema, type DrilldownResponse } from '../../contracts/drilldown'
import { z } from 'zod'
import { readArtifactJson } from '../repositories/artifactRepository'

const drilldownsArtifactSchema = z.object({
  donors: z.array(drilldownResponseSchema.shape.donor.unwrap()),
  countries: z.array(drilldownResponseSchema.shape.country.unwrap()),
  defaultSelection: drilldownResponseSchema,
})

function parseDashboardQuery(searchParams?: URLSearchParams) {
  if (searchParams === undefined) {
    return dashboardQuerySchema.parse({})
  }

  return dashboardQuerySchema.parse(Object.fromEntries(searchParams.entries()))
}

export async function getDrilldown(searchParams?: URLSearchParams): Promise<DrilldownResponse> {
  const query = parseDashboardQuery(searchParams)
  const artifact = drilldownsArtifactSchema.parse(await readArtifactJson('drilldowns'))

  if (query.selectionType === 'donor' && query.selectionId !== undefined) {
    return drilldownResponseSchema.parse({
      donor: artifact.donors.find((donor) => donor.id === query.selectionId) ?? null,
      country: null,
    })
  }

  if (query.selectionType === 'country' && query.selectionId !== undefined) {
    return drilldownResponseSchema.parse({
      donor: null,
      country:
        artifact.countries.find(
          (country) => country.iso3 === query.selectionId || country.name === query.selectionId,
        ) ?? null,
    })
  }

  return drilldownResponseSchema.parse(artifact.defaultSelection)
}

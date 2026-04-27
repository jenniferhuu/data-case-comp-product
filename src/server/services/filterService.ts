import { z } from 'zod'
import { normalizeSectorLabels } from '../../lib/sectorLabels'
import { readArtifactJson } from '../repositories/artifactRepository'

const filtersArtifactSchema = z.object({
  donors: z.array(z.string()).default([]),
  donorCountries: z.array(z.string()),
  recipientCountries: z.array(z.string()).default([]),
  sectors: z.array(z.string()),
  years: z.array(z.number()),
  markers: z.array(z.string()),
  donorIdMap: z.record(z.string()).default({}),
  recipientCountryIsoMap: z.record(z.string()).default({}),
})

type FiltersArtifact = z.infer<typeof filtersArtifactSchema>

export async function getFilters(): Promise<FiltersArtifact> {
  const artifact = await readArtifactJson('filters')
  const parsed = filtersArtifactSchema.parse(artifact)

  return {
    ...parsed,
    sectors: normalizeSectorLabels(parsed.sectors),
  }
}

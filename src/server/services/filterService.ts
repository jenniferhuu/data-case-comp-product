import { z } from 'zod'
import { readArtifactJson } from '../repositories/artifactRepository'

const filtersArtifactSchema = z.object({
  donorCountries: z.array(z.string()),
  sectors: z.array(z.string()),
  years: z.array(z.number()),
  markers: z.array(z.string()),
})

type FiltersArtifact = z.infer<typeof filtersArtifactSchema>

export async function getFilters(): Promise<FiltersArtifact> {
  const artifact = await readArtifactJson('filters')
  return filtersArtifactSchema.parse(artifact)
}

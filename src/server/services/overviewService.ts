import { overviewResponseSchema, type OverviewResponse } from '../../contracts/overview'
import { readArtifactJson } from '../repositories/artifactRepository'

export async function getOverview(): Promise<OverviewResponse> {
  const artifact = await readArtifactJson('overview')
  return overviewResponseSchema.parse(artifact)
}

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { GENERATED_ROOT } from '../../pipeline/config'

export type ArtifactName = 'overview' | 'globe' | 'filters' | 'drilldowns'
const artifactCache = new Map<ArtifactName, unknown>()

export async function readArtifactJson(name: ArtifactName): Promise<unknown> {
  const cached = artifactCache.get(name)

  if (cached !== undefined) {
    return cached
  }

  const content = await readFile(join(GENERATED_ROOT, `${name}.json`), 'utf8')
  const parsed = JSON.parse(content) as unknown
  artifactCache.set(name, parsed)

  return parsed
}

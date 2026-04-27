import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { GENERATED_ROOT } from '../../pipeline/config'

export type ArtifactName = 'overview' | 'globe' | 'filters' | 'drilldowns'

export async function readArtifactJson(name: ArtifactName): Promise<unknown> {
  const content = await readFile(join(GENERATED_ROOT, `${name}.json`), 'utf8')
  return JSON.parse(content) as unknown
}

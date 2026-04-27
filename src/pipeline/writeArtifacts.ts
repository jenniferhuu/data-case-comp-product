import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { GENERATED_ROOT } from './config'

export async function writeArtifact(name: string, data: unknown): Promise<void> {
  await mkdir(GENERATED_ROOT, { recursive: true })
  await writeFile(join(GENERATED_ROOT, `${name}.json`), JSON.stringify(data, null, 2))
}

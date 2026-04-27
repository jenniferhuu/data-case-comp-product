import { readFile } from 'node:fs/promises'
import { basename, isAbsolute, resolve } from 'node:path'
import Papa from 'papaparse'
import { INPUT_ROOT } from '../config'

export interface RawEnrichmentRow {
  [key: string]: string
}

export async function loadEnrichment(fileName: string): Promise<RawEnrichmentRow[]> {
  if (
    fileName.length === 0 ||
    fileName === '.' ||
    fileName === '..' ||
    isAbsolute(fileName) ||
    basename(fileName) !== fileName
  ) {
    throw new Error(`Enrichment file name must be a plain file name inside data/input: ${fileName}`)
  }

  const content = await readFile(resolve(INPUT_ROOT, fileName), 'utf8')
  const parsed = Papa.parse<RawEnrichmentRow>(content, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message)
  }

  return parsed.data
}

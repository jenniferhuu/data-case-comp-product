import { readFile } from 'node:fs/promises'
import Papa from 'papaparse'
import { PRIMARY_CSV_PATH } from '../config'

export interface RawFundingRow {
  [key: string]: string
}

export async function loadPrimaryCsv(): Promise<RawFundingRow[]> {
  let content: string

  try {
    content = await readFile(PRIMARY_CSV_PATH, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Primary CSV not found at ${PRIMARY_CSV_PATH}. Expected canonical input file data/input/primary.csv.`)
    }

    throw error
  }

  const parsed = Papa.parse<RawFundingRow>(content, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message)
  }

  return parsed.data
}

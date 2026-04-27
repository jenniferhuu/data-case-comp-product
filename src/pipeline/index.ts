import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRIMARY_CSV_PATH } from './config'
import { loadPrimaryCsv } from './loaders/loadPrimaryCsv'

export async function runPipeline() {
  const rows = await loadPrimaryCsv()

  return {
    ok: true as const,
    primaryCsvPath: PRIMARY_CSV_PATH,
    primaryRowCount: rows.length,
  }
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : null
const modulePath = fileURLToPath(import.meta.url)

if (entryPath === modulePath) {
  runPipeline().then((result) => {
    console.log(`Pipeline scaffold complete (${result.primaryRowCount} rows from ${result.primaryCsvPath})`)
  })
}

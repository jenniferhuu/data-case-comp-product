import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRIMARY_CSV_PATH } from './config'
import { buildDrilldownArtifact } from './derive/buildDrilldownArtifact'
import { buildFiltersArtifact } from './derive/buildFiltersArtifact'
import { buildGlobeArtifact } from './derive/buildGlobeArtifact'
import { buildOverviewArtifact } from './derive/buildOverviewArtifact'
import { loadPrimaryCsv } from './loaders/loadPrimaryCsv'
import { normalizeRows } from './normalize/normalizeRows'
import { writeArtifact } from './writeArtifacts'

export async function runPipeline() {
  const rawRows = await loadPrimaryCsv()
  const rows = normalizeRows(rawRows)

  await writeArtifact('overview', buildOverviewArtifact(rows))
  await writeArtifact('globe', buildGlobeArtifact(rows))
  await writeArtifact('filters', buildFiltersArtifact(rows))
  await writeArtifact('drilldowns', buildDrilldownArtifact(rows))

  return {
    ok: true as const,
    primaryCsvPath: PRIMARY_CSV_PATH,
    primaryRowCount: rawRows.length,
  }
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : null
const modulePath = fileURLToPath(import.meta.url)

if (entryPath === modulePath) {
  runPipeline().then((result) => {
    console.log(`Pipeline scaffold complete (${result.primaryRowCount} rows from ${result.primaryCsvPath})`)
  })
}

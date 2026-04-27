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

type RequiredColumn = string | readonly string[]

export function ensureRequiredColumns(rows: Record<string, string>[], required: readonly RequiredColumn[]) {
  const sample = rows[0] ?? {}

  for (const requirement of required) {
    const aliases = Array.isArray(requirement) ? requirement : [requirement]
    const hasSupportedColumn = aliases.some((column) => column in sample)

    if (!hasSupportedColumn) {
      throw new Error(`Missing required column: ${aliases.join(' or ')}`)
    }
  }
}

export async function runPipeline() {
  const rawRows = await loadPrimaryCsv()
  ensureRequiredColumns(rawRows, [
    'year',
    ['donor_name', 'organization_name'],
    ['recipient_name', 'country'],
    ['donor_country', 'Donor_country'],
    ['usd_disbursed', 'usd_disbursed_m', 'usd_disbursements_defl'],
    ['sector', 'Sector'],
  ])
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

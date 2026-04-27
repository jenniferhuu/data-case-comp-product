import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GENERATED_ROOT, PRIMARY_CSV_PATH } from './config'
import { buildDrilldownArtifact } from './derive/buildDrilldownArtifact'
import { buildFiltersArtifact } from './derive/buildFiltersArtifact'
import { buildGlobeArtifact } from './derive/buildGlobeArtifact'
import { buildOverviewArtifact } from './derive/buildOverviewArtifact'
import { loadPrimaryCsv } from './loaders/loadPrimaryCsv'
import { normalizeRows } from './normalize/normalizeRows'
import { writeArtifact } from './writeArtifacts'

type RequiredColumn = string | readonly string[]
const REQUIRED_GENERATED_ARTIFACTS = ['overview', 'globe', 'filters', 'drilldowns'] as const

async function fileExists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function hasPrimaryCsv() {
  return fileExists(PRIMARY_CSV_PATH)
}

async function hasGeneratedArtifacts() {
  const artifactChecks = await Promise.all(
    REQUIRED_GENERATED_ARTIFACTS.map((name) => fileExists(resolve(GENERATED_ROOT, `${name}.json`))),
  )

  return artifactChecks.every(Boolean)
}

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
  if (!(await hasPrimaryCsv())) {
    if (await hasGeneratedArtifacts()) {
      return {
        ok: true as const,
        primaryCsvPath: PRIMARY_CSV_PATH,
        primaryRowCount: 0,
        usedCommittedArtifacts: true,
      }
    }

    throw new Error(
      `Primary CSV not found at ${PRIMARY_CSV_PATH}, and no generated artifacts were available in ${GENERATED_ROOT}.`,
    )
  }

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
    usedCommittedArtifacts: false,
  }
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : null
const modulePath = fileURLToPath(import.meta.url)

if (entryPath === modulePath) {
  runPipeline().then((result) => {
    if (result.usedCommittedArtifacts) {
      console.log(`Pipeline scaffold skipped source ingest; using committed artifacts in ${GENERATED_ROOT}`)
      return
    }

    console.log(`Pipeline scaffold complete (${result.primaryRowCount} rows from ${result.primaryCsvPath})`)
  })
}

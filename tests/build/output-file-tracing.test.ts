import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

interface NftManifest {
  files: string[]
}

function readTraceManifest(route: string): NftManifest {
  const manifestPath = join('.next', 'server', 'app', 'api', route, 'route.js.nft.json')

  expect(existsSync(manifestPath)).toBe(true)

  return JSON.parse(readFileSync(manifestPath, 'utf8')) as NftManifest
}

function normalizeFiles(files: string[]) {
  return files.map((file) => file.replace(/\\/g, '/'))
}

describe('output file tracing', () => {
  it('includes committed runtime data for API routes', () => {
    const filtersTrace = readTraceManifest('filters')
    const globeTrace = readTraceManifest('globe')
    const overviewTrace = readTraceManifest('overview')
    const drilldownTrace = readTraceManifest('drilldown')

    expect(normalizeFiles(filtersTrace.files)).toContain('../../../../../data/generated/filters.json')

    expect(normalizeFiles(globeTrace.files)).toEqual(
      expect.arrayContaining([
        '../../../../../data/generated/globe.json',
        '../../../../../public/data/countries_geo.json',
      ]),
    )

    expect(normalizeFiles(overviewTrace.files)).toEqual(
      expect.arrayContaining([
        '../../../../../data/generated/overview.json',
        '../../../../../data/generated/globe.json',
        '../../../../../public/data/donor_summary.json',
        '../../../../../public/data/country_summary.json',
      ]),
    )

    expect(normalizeFiles(drilldownTrace.files)).toEqual(
      expect.arrayContaining([
        '../../../../../data/generated/globe.json',
        '../../../../../public/data/donor_summary.json',
        '../../../../../public/data/country_summary.json',
      ]),
    )
  })
})

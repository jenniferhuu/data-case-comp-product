import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildDrilldownArtifact } from '../../src/pipeline/derive/buildDrilldownArtifact'
import { runPipeline } from '../../src/pipeline/index'
import type { CanonicalFundingRow } from '../../src/pipeline/normalize/normalizeRows'

interface OverviewArtifact {
  totals: {
    fundingUsdM: number
    donors: number
    countries: number
    corridors: number
  }
  highlights: Array<{
    id: string
    label: string
    value: string
    tone: 'neutral' | 'positive' | 'warning'
  }>
}

interface GlobeArtifact {
  flows: Array<{
    donorId: string
    donorName: string
    donorCountry: string
    recipientIso3: string
    recipientName: string
    year: number
    amountUsdM: number
    sector: string
  }>
}

interface FiltersArtifact {
  donorCountries: string[]
  sectors: string[]
  years: number[]
  markers: string[]
}

interface DrilldownsArtifact {
  donors: Array<{
    id: string
    name: string
    country: string
    totalUsdM: number
  }>
  countries: Array<{
    iso3: string
    name: string
    totalUsdM: number
  }>
  defaultSelection: {
    donor: null
    country: null
  }
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

describe('pipeline artifacts', () => {
  it('writes generated artifacts with basic app-ready semantics', async () => {
    await runPipeline()

    expect(existsSync('data/generated/overview.json')).toBe(true)
    expect(existsSync('data/generated/globe.json')).toBe(true)
    expect(existsSync('data/generated/filters.json')).toBe(true)
    expect(existsSync('data/generated/drilldowns.json')).toBe(true)

    const overview = readJsonFile<OverviewArtifact>('data/generated/overview.json')
    const globe = readJsonFile<GlobeArtifact>('data/generated/globe.json')
    const filters = readJsonFile<FiltersArtifact>('data/generated/filters.json')
    const drilldowns = readJsonFile<DrilldownsArtifact>('data/generated/drilldowns.json')

    expect(overview.totals.fundingUsdM).toBeGreaterThan(0)
    expect(overview.totals.donors).toBeGreaterThan(0)
    expect(overview.totals.countries).toBe(drilldowns.countries.length)
    expect(Array.isArray(overview.highlights)).toBe(true)

    expect(globe.flows.length).toBeGreaterThan(0)
    expect(globe.flows[0]).toMatchObject({
      donorId: expect.any(String),
      donorName: expect.any(String),
      donorCountry: expect.any(String),
      recipientIso3: expect.any(String),
      recipientName: expect.any(String),
      year: expect.any(Number),
      amountUsdM: expect.any(Number),
      sector: expect.any(String),
    })

    expect(filters.years.length).toBeGreaterThan(0)
    expect(filters.years).not.toContain(0)
    expect(filters.years.every((year) => Number.isInteger(year) && year > 0)).toBe(true)
    expect(filters.markers.length).toBeGreaterThan(0)

    expect(drilldowns.donors.length).toBeGreaterThan(0)
    expect(drilldowns.countries.length).toBeGreaterThan(0)
    expect(drilldowns.defaultSelection).toEqual({ donor: null, country: null })

    const unresolvedCountryEntries = drilldowns.countries.filter((country) => country.iso3 === 'UNK')
    if (unresolvedCountryEntries.length > 0) {
      expect(new Set(unresolvedCountryEntries.map((country) => country.name)).size).toBe(unresolvedCountryEntries.length)
    }
  })

  it('keeps unresolved recipients distinct in drilldown artifacts', () => {
    const rows: CanonicalFundingRow[] = [
      {
        year: 2022,
        amountUsdM: 10,
        sector: 'Health',
        donor: {
          id: 'donor-a',
          name: 'Donor A',
          country: 'United States',
        },
        recipient: {
          iso3: 'UNK',
          name: 'Ukraine',
        },
      },
      {
        year: 2022,
        amountUsdM: 5,
        sector: 'Health',
        donor: {
          id: 'donor-a',
          name: 'Donor A',
          country: 'United States',
        },
        recipient: {
          iso3: 'UNK',
          name: 'Kenya',
        },
      },
    ]

    const artifact = buildDrilldownArtifact(rows)
    const unresolvedCountryEntries = artifact.countries.filter((country) => country.iso3 === 'UNK')

    expect(unresolvedCountryEntries).toHaveLength(2)
    expect(unresolvedCountryEntries.map((country) => country.name).sort()).toEqual(['Kenya', 'Ukraine'])
  })
})

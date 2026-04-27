import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { overviewResponseSchema } from '../../src/contracts/overview'

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.unmock('../../src/server/repositories/artifactRepository')
})

describe('server services', () => {
  it('getOverview reads the generated overview artifact', async () => {
    const expected = overviewResponseSchema.parse(
      JSON.parse(readFileSync('data/generated/overview.json', 'utf8')),
    )
    const { getOverview } = await import('../../src/server/services/overviewService')

    await expect(getOverview()).resolves.toEqual(expected)
  })

  it('getFilters returns the generated filter artifact shape', async () => {
    const expected = JSON.parse(readFileSync('data/generated/filters.json', 'utf8')) as {
      donorCountries: string[]
      sectors: string[]
      years: number[]
      markers: string[]
    }
    const { getFilters } = await import('../../src/server/services/filterService')

    await expect(getFilters()).resolves.toEqual(expected)
  })

  it('getDrilldown returns the default empty selection when no selection is provided', async () => {
    const { getDrilldown } = await import('../../src/server/services/drilldownService')

    await expect(getDrilldown()).resolves.toEqual({
      donor: null,
      country: null,
    })
  })

  it('getDrilldown resolves a known donor selection from the generated artifact', async () => {
    const drilldowns = JSON.parse(readFileSync('data/generated/drilldowns.json', 'utf8')) as {
      donors: Array<{ id: string, name: string, country: string, totalUsdM: number }>
    }
    const knownDonor = drilldowns.donors[0]
    const { getDrilldown } = await import('../../src/server/services/drilldownService')

    await expect(
      getDrilldown(new URLSearchParams({
        selectionType: 'donor',
        selectionId: knownDonor.id,
      })),
    ).resolves.toEqual({
      donor: knownDonor,
      country: null,
    })
  })

  it('getFilters fails at the service contract boundary for an invalid artifact shape', async () => {
    vi.doMock('../../src/server/repositories/artifactRepository', () => ({
      readArtifactJson: vi.fn(async () => ({ years: 'not-an-array' })),
    }))
    const { getFilters } = await import('../../src/server/services/filterService')

    await expect(getFilters()).rejects.toMatchObject({
      name: 'ZodError',
    })
  })

  it('getDrilldown fails at the service contract boundary for an invalid artifact shape', async () => {
    vi.doMock('../../src/server/repositories/artifactRepository', () => ({
      readArtifactJson: vi.fn(async () => ({ defaultSelection: null })),
    }))
    const { getDrilldown } = await import('../../src/server/services/drilldownService')

    await expect(getDrilldown()).rejects.toMatchObject({
      name: 'ZodError',
    })
  })

  it('getGlobeData returns aggregated scene payload rather than raw flows', async () => {
    vi.doMock('../../src/server/repositories/artifactRepository', () => ({
      readArtifactJson: vi.fn(async () => ({
        flows: [
          {
            donorId: 'gates-foundation',
            donorName: 'Gates Foundation',
            donorCountry: 'United States',
            recipientIso3: 'UKR',
            recipientName: 'Ukraine',
            year: 2023,
            amountUsdM: 120.2,
            sector: '720',
          },
        ],
      })),
    }))
    vi.doMock('../../src/server/repositories/geoRepository', () => ({
      readCountriesGeoJson: vi.fn(async () => [
        { iso3: 'USA', name: 'United States', lat: 37.09, lon: -95.71, continent: 'Americas' },
        { iso3: 'UKR', name: 'Ukraine', lat: 49.0, lon: 32.0, continent: 'Europe' },
      ]),
    }))
    const { getGlobeData } = await import('../../src/server/services/globeService')

    const response = await getGlobeData()

    expect(response).toEqual({
      arcs: [
        expect.objectContaining({
          donorId: 'gates-foundation',
          recipientIso3: 'UKR',
          amountUsdM: 120.2,
        }),
      ],
      points: [
        expect.objectContaining({
          iso3: 'UKR',
          totalUsdM: 120.2,
        }),
      ],
      visibleFundingUsdM: 120.2,
    })
  })
})

import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { drilldownResponseSchema } from '../../src/contracts/drilldown'
import { overviewResponseSchema } from '../../src/contracts/overview'
import { normalizeSectorLabels } from '../../src/lib/sectorLabels'

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.unmock('../../src/server/repositories/artifactRepository')
})

describe('server services', () => {
  it('getOverview reads the generated overview artifact', async () => {
    const { getOverview } = await import('../../src/server/services/overviewService')
    const response = await getOverview()

    expect(overviewResponseSchema.parse(response)).toEqual(response)
    expect(response.totals).toEqual(
      JSON.parse(readFileSync('data/generated/overview.json', 'utf8')).totals,
    )
    expect(response.topDonors[0]).toEqual({
      label: 'Gates Foundation',
      totalUsdM: 18890.4033,
    })
    expect(response.topRecipients[0]).toEqual({
      label: 'China',
      totalUsdM: 8846.9111,
    })
    expect(response.topSectors[0]).toEqual({
      label: 'Health',
      totalUsdM: 27101.589,
    })
    expect(response.yearlyFunding).toEqual([
      { year: 2020, totalUsdM: 17170.5555 },
      { year: 2021, totalUsdM: 17381.5559 },
      { year: 2022, totalUsdM: 16679.5496 },
      { year: 2023, totalUsdM: 16919.8854 },
    ])
  })

  it('getFilters returns the generated filter artifact shape', async () => {
    const expected = JSON.parse(readFileSync('data/generated/filters.json', 'utf8')) as {
      donorCountries: string[]
      sectors: string[]
      years: number[]
      markers: string[]
    }
    const normalizedExpected = {
      ...expected,
      sectors: normalizeSectorLabels(expected.sectors),
    }
    const { getFilters } = await import('../../src/server/services/filterService')

    await expect(getFilters()).resolves.toEqual(normalizedExpected)
  })

  it('getDrilldown returns the default empty selection when no selection is provided', async () => {
    const { getDrilldown } = await import('../../src/server/services/drilldownService')

    await expect(getDrilldown()).resolves.toEqual(drilldownResponseSchema.parse({
      donor: null,
      country: null,
    }))
  })

  it('getDrilldown resolves a known donor selection from the committed donor summary', async () => {
    const { getDrilldown } = await import('../../src/server/services/drilldownService')

    await expect(
      getDrilldown(new URLSearchParams({
        selectionType: 'donor',
        selectionId: 'gates-foundation',
      })),
    ).resolves.toMatchObject({
      donor: {
        id: 'gates-foundation',
        name: 'Gates Foundation',
        country: 'United States',
        totalUsdM: 18890.4033,
      },
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

  it('getDrilldown fails at the service contract boundary for an invalid globe artifact shape', async () => {
    vi.doMock('../../src/server/repositories/artifactRepository', () => ({
      readArtifactJson: vi.fn(async () => ({ flows: 'not-an-array' })),
    }))
    const { getDrilldown } = await import('../../src/server/services/drilldownService')

    await expect(
      getDrilldown(new URLSearchParams({
        selectionType: 'donor',
        selectionId: 'gates-foundation',
      })),
    ).rejects.toMatchObject({
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

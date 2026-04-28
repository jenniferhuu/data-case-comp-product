import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { drilldownResponseSchema } from '../../src/contracts/drilldown'
import { overviewResponseSchema } from '../../src/contracts/overview'
import { normalizeSectorLabels } from '../../src/lib/sectorLabels'

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.unmock('../../src/server/repositories/fundingRowsRepository')
})

describe('server services', () => {
  it('getOverview reads the generated overview artifact', async () => {
    const { getOverview } = await import('../../src/server/services/overviewService')
    const response = await getOverview()

    expect(overviewResponseSchema.parse(response)).toEqual(response)
    expect(response.totals.fundingUsdM).toBeGreaterThan(68000)
    expect(response.totals.donors).toBeGreaterThan(400)
    expect(response.topDonors[0]).toMatchObject({
      id: 'gates-foundation',
      label: 'Gates Foundation',
      totalUsdM: 18890.4033,
      country: 'United States',
    })
    expect(response.topRecipients[0]).toMatchObject({
      label: expect.any(String),
      totalUsdM: expect.any(Number),
    })
    expect(response.topSectors[0]).toMatchObject({
      label: 'Health',
      totalUsdM: expect.any(Number),
    })
    expect(response.modalityBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Grants', totalUsdM: expect.any(Number) }),
      ]),
    )
    expect(response.commitmentProgress).toEqual(
      expect.objectContaining({ disbursedPct: expect.any(Number) }),
    )
    expect(response.yearlyFunding).toEqual([
      { year: 2020, totalUsdM: 17170.5555 },
      { year: 2021, totalUsdM: 17381.5559 },
      { year: 2022, totalUsdM: 16679.5496 },
      { year: 2023, totalUsdM: 16919.8854 },
    ])
  })

  it('getOverview respects valueMode and donor-country filters', async () => {
    const { getOverview } = await import('../../src/server/services/overviewService')

    const disbursements = await getOverview(new URLSearchParams({
      donorCountry: 'United States',
      valueMode: 'disbursements',
    }))
    const commitments = await getOverview(new URLSearchParams({
      donorCountry: 'United States',
      valueMode: 'commitments',
    }))

    expect(disbursements.topDonors.every((donor) => donor.country === 'United States')).toBe(true)
    expect(commitments.topDonors.every((donor) => donor.country === 'United States')).toBe(true)
    expect(commitments.totals.fundingUsdM).not.toBe(disbursements.totals.fundingUsdM)
    expect(commitments.commitmentProgress.disbursedPct).toBeGreaterThan(0)
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
      donorCountry: null,
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
        topImplementers: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            totalUsdM: expect.any(Number),
          }),
        ]),
      },
      country: null,
      donorCountry: null,
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

  it('getDrilldown fails when normalized funding rows cannot be loaded', async () => {
    vi.doMock('../../src/server/repositories/fundingRowsRepository', () => ({
      readFundingRows: vi.fn(async () => {
        throw new Error('rows unavailable')
      }),
    }))
    const { getDrilldown } = await import('../../src/server/services/drilldownService')

    await expect(getDrilldown()).rejects.toThrow('rows unavailable')
  })

  it('getGlobeData returns aggregated scene payload rather than raw flows', async () => {
    vi.doMock('../../src/server/repositories/fundingRowsRepository', () => ({
      readFundingRows: vi.fn(async () => [
        {
          year: 2023,
          disbursementsUsdM: 120.2,
          commitmentsUsdM: 140.5,
          sector: '720',
          channelName: 'UNICEF',
          financialInstrument: 'Grant',
          donor: {
            id: 'gates-foundation',
            name: 'Gates Foundation',
            country: 'United States',
          },
          recipient: {
            iso3: 'UKR',
            name: 'Ukraine',
          },
        },
      ]),
    }))
    vi.doMock('../../src/server/services/dashboardData', async () => {
      const actual = await vi.importActual<typeof import('../../src/server/services/dashboardData')>('../../src/server/services/dashboardData')
      return {
        ...actual,
        loadFilteredRows: vi.fn(async () => ({
          query: actual.parseDashboardQuery(new URLSearchParams()),
          rows: [
            {
              year: 2023,
              disbursementsUsdM: 120.2,
              commitmentsUsdM: 140.5,
              sector: '720',
              channelName: 'UNICEF',
              financialInstrument: 'Grant',
              donor: {
                id: 'gates-foundation',
                name: 'Gates Foundation',
                country: 'United States',
              },
              recipient: {
                iso3: 'UKR',
                name: 'Ukraine',
              },
            },
          ],
        })),
      }
    })
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
      crossBorderPct: 100,
      domesticPct: 0,
    })
  })
})

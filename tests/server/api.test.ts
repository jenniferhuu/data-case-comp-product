import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.unmock('../../src/server/services/overviewService')
  vi.unmock('../../src/server/services/globeService')
  vi.unmock('../../src/server/services/drilldownService')
})

describe('GET /api/overview', () => {
  it('returns a 200 response with overview totals', async () => {
    const { GET } = await import('../../src/app/api/overview/route')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.totals.countries).toBeTypeOf('number')
    expect(Array.isArray(body.highlights)).toBe(true)
  })

  it('returns a stable 500 payload when the service throws', async () => {
    vi.doMock('../../src/server/services/overviewService', () => ({
      getOverview: vi.fn(async () => {
        throw new Error('database credentials missing')
      }),
    }))
    const { GET } = await import('../../src/app/api/overview/route')

    const response = await GET()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'OVERVIEW_UNAVAILABLE',
      message: 'Overview data is unavailable.',
    })
  })
})

describe('GET /api/filters', () => {
  it('returns a 200 response with filter collections', async () => {
    const { GET } = await import('../../src/app/api/filters/route')

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(body.donorCountries)).toBe(true)
    expect(Array.isArray(body.sectors)).toBe(true)
  })
})

describe('GET /api/globe', () => {
  it('returns 200 and forwards request search params to the globe service', async () => {
    const searchParams = new URLSearchParams({
      yearMode: 'single',
      year: '2022',
      sector: 'Health',
    })
    const getGlobeData = vi.fn(async (receivedSearchParams?: URLSearchParams) => {
      expect(receivedSearchParams).toBe(searchParams)
      expect(receivedSearchParams?.get('year')).toBe('2022')
      expect(receivedSearchParams?.get('sector')).toBe('Health')

      return { arcs: [], points: [], visibleFundingUsdM: 0 }
    })

    vi.doMock('../../src/server/services/globeService', () => ({
      getGlobeData,
    }))
    const { GET } = await import('../../src/app/api/globe/route')

    const response = await GET({
      nextUrl: { searchParams },
    } as Parameters<typeof GET>[0])

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ arcs: [], points: [], visibleFundingUsdM: 0 })
    expect(getGlobeData).toHaveBeenCalledTimes(1)
  })
})

describe('GET /api/drilldown', () => {
  it('returns 200 and forwards request search params to the drilldown service', async () => {
    const searchParams = new URLSearchParams({
      selectionType: 'donor',
      selectionId: 'acme-foundation',
    })
    const getDrilldown = vi.fn(async (receivedSearchParams?: URLSearchParams) => {
      expect(receivedSearchParams).toBe(searchParams)
      expect(receivedSearchParams?.get('selectionType')).toBe('donor')
      expect(receivedSearchParams?.get('selectionId')).toBe('acme-foundation')

      return {
        donor: { id: 'acme-foundation', name: 'Acme Foundation', country: 'United States', totalUsdM: 10 },
        country: null,
      }
    })

    vi.doMock('../../src/server/services/drilldownService', () => ({
      getDrilldown,
    }))
    const { GET } = await import('../../src/app/api/drilldown/route')

    const response = await GET({
      nextUrl: { searchParams },
    } as Parameters<typeof GET>[0])

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      donor: { id: 'acme-foundation', name: 'Acme Foundation', country: 'United States', totalUsdM: 10 },
      country: null,
    })
    expect(getDrilldown).toHaveBeenCalledTimes(1)
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.unmock('../../src/server/services/overviewService')
  vi.unmock('../../src/server/services/filterService')
  vi.unmock('../../src/server/services/globeService')
  vi.unmock('../../src/server/services/drilldownService')
})

describe('route error handling', () => {
  it('does not expose the shared api helper from the overview route module', async () => {
    const routeModule = await import('../../src/app/api/overview/route')

    expect(routeModule).toHaveProperty('GET')
    expect('handleApiRequest' in routeModule).toBe(false)
  })

  it('returns a stable 500 payload for overview failures', async () => {
    vi.doMock('../../src/server/services/overviewService', () => ({
      getOverview: vi.fn(async () => {
        throw new Error('artifact unreadable')
      }),
    }))

    const { GET } = await import('../../src/app/api/overview/route')
    const response = await GET({
      nextUrl: { searchParams: new URLSearchParams() },
    } as Parameters<typeof GET>[0])

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'OVERVIEW_UNAVAILABLE',
      message: 'Overview data is unavailable.',
    })
  })

  it('returns a stable 500 payload for filter failures', async () => {
    vi.doMock('../../src/server/services/filterService', () => ({
      getFilters: vi.fn(async () => {
        throw new Error('artifact unreadable')
      }),
    }))

    const { GET } = await import('../../src/app/api/filters/route')
    const response = await GET()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'FILTERS_UNAVAILABLE',
      message: 'Filter data is unavailable.',
    })
  })

  it('returns a stable 500 payload for globe failures', async () => {
    vi.doMock('../../src/server/services/globeService', () => ({
      getGlobeData: vi.fn(async () => {
        throw new Error('artifact unreadable')
      }),
    }))

    const { GET } = await import('../../src/app/api/globe/route')
    const response = await GET({
      nextUrl: { searchParams: new URLSearchParams() },
    } as Parameters<typeof GET>[0])

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'GLOBE_UNAVAILABLE',
      message: 'Globe data is unavailable.',
    })
  })

  it('returns a stable 500 payload for drilldown failures', async () => {
    vi.doMock('../../src/server/services/drilldownService', () => ({
      getDrilldown: vi.fn(async () => {
        throw new Error('artifact unreadable')
      }),
    }))

    const { GET } = await import('../../src/app/api/drilldown/route')
    const response = await GET({
      nextUrl: { searchParams: new URLSearchParams() },
    } as Parameters<typeof GET>[0])

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'DRILLDOWN_UNAVAILABLE',
      message: 'Drilldown data is unavailable.',
    })
  })
})

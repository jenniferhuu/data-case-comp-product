import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.unmock('../../src/server/services/overviewService')
})

describe('overview route error handling', () => {
  it('only exports valid route-module symbols', async () => {
    const routeModule = await import('../../src/app/api/overview/route')

    expect(Object.keys(routeModule).sort()).toEqual(['GET'])
  })

  it('returns a stable 500 payload when the service throws', async () => {
    vi.doMock('../../src/server/services/overviewService', () => ({
      getOverview: vi.fn(async () => {
        throw new Error('artifact unreadable')
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

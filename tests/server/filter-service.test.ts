import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.unmock('../../src/server/repositories/artifactRepository')
})

describe('getFilters', () => {
  it('returns normalized, de-duplicated sector labels', async () => {
    const { getFilters } = await import('../../src/server/services/filterService')

    await expect(getFilters()).resolves.toMatchObject({
      sectors: expect.arrayContaining([
        'Education',
        'Health',
        'Environment',
        'Climate',
        'Gov & Civil Society',
        'Economic Dev',
        'Emergency',
        'Water & Sanitation',
        'Multi-sector',
        'Other',
      ]),
    })

    const filters = await getFilters()
    expect(filters.sectors).not.toContain('120')
    expect(filters.sectors).not.toContain('140; 310; 410')
    expect(new Set(filters.sectors).size).toBe(filters.sectors.length)
  })
})

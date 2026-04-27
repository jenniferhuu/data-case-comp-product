import { describe, expect, it } from 'vitest'
import { normalizeSectorLabel, normalizeSectorLabels } from '../../src/lib/sectorLabels'

describe('sector labels', () => {
  it('maps known numeric sector codes to readable labels', () => {
    expect(normalizeSectorLabel('120')).toBe('Health')
    expect(normalizeSectorLabel('140')).toBe('Water & Sanitation')
  })

  it('maps multi-code sector strings to a stable fallback label', () => {
    expect(normalizeSectorLabel('140; 310; 410')).toBe('Multi-sector')
  })

  it('passes through readable labels and de-duplicates normalized arrays', () => {
    expect(normalizeSectorLabel('Environment')).toBe('Environment')
    expect(normalizeSectorLabels(['120', 'Environment', '120', '140; 310; 410', '910'])).toEqual([
      'Environment',
      'Health',
      'Multi-sector',
    ])
  })
})

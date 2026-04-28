import { describe, test, expect } from 'vitest'
import { computeArcProperties } from './GlobeScene'
import type { GlobeArcDatum } from './globePresentation'
import { getSectorArcColors, DELTA_COLOR_RAMPS } from '../../lib/colorScales'

const baseArc: GlobeArcDatum = {
  donorId: 'donor-1',
  donorName: 'Test Donor',
  donorCountry: 'USA',
  donorLat: 40.7,
  donorLon: -74.0,
  recipientIso3: 'ETH',
  recipientName: 'Ethiopia',
  recipientLat: 9.1,
  recipientLon: 40.5,
  amountUsdM: 100,
  years: [2022],
  yearAmounts: [{ year: 2022, totalUsdM: 100 }],
  sector: 'Health',
}

describe('computeArcProperties', () => {
  test('non-compare mode returns sector arc colors', () => {
    const [result] = computeArcProperties([baseArc], false, undefined, undefined)
    expect(result._color).toEqual(getSectorArcColors('Health'))
  })

  test('compare mode with positive delta returns positive ramp', () => {
    const arc: GlobeArcDatum = {
      ...baseArc,
      yearAmounts: [
        { year: 2022, totalUsdM: 50 },
        { year: 2023, totalUsdM: 150 },
      ],
    }
    const [result] = computeArcProperties([arc], true, 2022, 2023)
    expect(result._color).toEqual([...DELTA_COLOR_RAMPS.positive])
  })

  test('compare mode with negative delta returns negative ramp', () => {
    const arc: GlobeArcDatum = {
      ...baseArc,
      yearAmounts: [
        { year: 2022, totalUsdM: 150 },
        { year: 2023, totalUsdM: 50 },
      ],
    }
    const [result] = computeArcProperties([arc], true, 2022, 2023)
    expect(result._color).toEqual([...DELTA_COLOR_RAMPS.negative])
  })

  test('stroke scales with amountUsdM', () => {
    const [result] = computeArcProperties([baseArc], false, undefined, undefined)
    expect(result._stroke).toBeCloseTo(Math.min(1.35, 0.28 + 100 / 900))
  })

  test('stroke is capped at 1.35 for very large amounts', () => {
    const bigArc = { ...baseArc, amountUsdM: 100_000 }
    const [result] = computeArcProperties([bigArc], false, undefined, undefined)
    expect(result._stroke).toBe(1.35)
  })

  test('altitude is within the 0.1–0.55 range', () => {
    const [result] = computeArcProperties([baseArc], false, undefined, undefined)
    expect(result._altitude).toBeGreaterThanOrEqual(0.1)
    expect(result._altitude).toBeLessThanOrEqual(0.55)
  })

  test('preserves all original GlobeArcDatum fields', () => {
    const [result] = computeArcProperties([baseArc], false, undefined, undefined)
    expect(result.donorId).toBe(baseArc.donorId)
    expect(result.amountUsdM).toBe(baseArc.amountUsdM)
    expect(result.sector).toBe(baseArc.sector)
  })

  test('compare mode with near-zero delta returns neutral ramp', () => {
    const arc: GlobeArcDatum = {
      ...baseArc,
      yearAmounts: [
        { year: 2022, totalUsdM: 100 },
        { year: 2023, totalUsdM: 100 },
      ],
    }
    const [result] = computeArcProperties([arc], true, 2022, 2023)
    expect(result._color).toEqual([...DELTA_COLOR_RAMPS.neutral])
  })
})

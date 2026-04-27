import { describe, expect, it } from 'vitest'
import { buildGlobePresentation } from '../../src/components/Globe/globePresentation'
import type { GlobeResponse } from '../../src/contracts/globe'

const globeResponse: GlobeResponse = {
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
    {
      donorId: 'gates-foundation',
      donorName: 'Gates Foundation',
      donorCountry: 'United States',
      recipientIso3: 'UKR',
      recipientName: 'Ukraine',
      year: 2022,
      amountUsdM: 79.8,
      sector: '720',
    },
    {
      donorId: 'akbank',
      donorName: 'Akbank Foundation',
      donorCountry: 'Turkey',
      recipientIso3: 'SYR',
      recipientName: 'Syrian Arab Republic',
      year: 2023,
      amountUsdM: 55.5,
      sector: '930',
    },
    {
      donorId: 'china-foundation',
      donorName: 'China Foundation',
      donorCountry: "China (People's Republic of)",
      recipientIso3: 'KEN',
      recipientName: 'Kenya',
      year: 2023,
      amountUsdM: 30,
      sector: '430',
    },
    {
      donorId: 'regional-fund',
      donorName: 'Regional Fund',
      donorCountry: 'Luxembourg',
      recipientIso3: 'UNK',
      recipientName: 'Bilateral, unspecified',
      year: 2023,
      amountUsdM: 450,
      sector: '998',
    },
  ],
}

const geo = [
  { iso3: 'USA', name: 'United States', lat: 37.09, lon: -95.71, continent: 'Americas' },
  { iso3: 'UKR', name: 'Ukraine', lat: 49.0, lon: 32.0, continent: 'Europe' },
  { iso3: 'TUR', name: 'TUR', lat: 38.96, lon: 35.24, continent: 'Europe' },
  { iso3: 'SYR', name: 'Syrian Arab Republic', lat: 34.8, lon: 38.99, continent: 'Asia' },
  { iso3: 'CHN', name: 'China', lat: 35.86, lon: 104.2, continent: 'Asia' },
  { iso3: 'KEN', name: 'Kenya', lat: -0.02, lon: 37.91, continent: 'Africa' },
]

describe('buildGlobePresentation', () => {
  it('aggregates flow corridors and resolves donor-country aliases into renderable arcs and points', () => {
    const presentation = buildGlobePresentation(globeResponse.flows, geo)

    expect(presentation.arcs).toHaveLength(4)
    expect(presentation.points).toHaveLength(4)

    expect(presentation.arcs.find((arc) => arc.donorId === 'gates-foundation')).toMatchObject({
      donorId: 'gates-foundation',
      recipientIso3: 'UKR',
      amountUsdM: 200,
      donorLat: 37.09,
      recipientLon: 32.0,
    })

    expect(presentation.arcs.find((arc) => arc.donorId === 'akbank')).toMatchObject({
      donorCountry: 'Turkey',
      donorLat: 38.96,
      donorLon: 35.24,
    })

    expect(presentation.arcs.find((arc) => arc.donorId === 'china-foundation')).toMatchObject({
      donorCountry: "China (People's Republic of)",
      donorLat: 35.86,
      donorLon: 104.2,
    })

    expect(presentation.points.find((point) => point.iso3 === 'UKR')).toMatchObject({
      totalUsdM: 200,
      donorCount: 1,
    })

    expect(presentation.arcs.find((arc) => arc.donorId === 'regional-fund')).toMatchObject({
      donorCountry: 'Luxembourg',
      recipientIso3: 'BIL',
      recipientName: 'Bilateral, unspecified',
      amountUsdM: 450,
    })
  })
})

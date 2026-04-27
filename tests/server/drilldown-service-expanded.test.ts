import { describe, expect, it } from 'vitest'
import { getDrilldown } from '../../src/server/services/drilldownService'

describe('drilldown service enriched analytics', () => {
  it('returns donor yearly funding, sector breakdown, counterparties, and concentration metrics', async () => {
    const response = await getDrilldown(new URLSearchParams({
      selectionType: 'donor',
      selectionId: 'gates-foundation',
    }))

    expect(response.country).toBeNull()
    expect(response.donor).toMatchObject({
      id: 'gates-foundation',
      name: 'Gates Foundation',
      country: 'United States',
    })
    expect(response.donor?.yearlyFunding).toEqual([
      { year: 2020, totalUsdM: 4721.6974 },
      { year: 2021, totalUsdM: 4784.3378 },
      { year: 2022, totalUsdM: 4547.8622 },
      { year: 2023, totalUsdM: 4836.506 },
    ])
    expect(response.donor?.recipientCount).toBeGreaterThan(90)
    expect(response.donor?.topRecipientShare).toBeGreaterThan(5)
    expect(response.donor?.sectorBreakdown[0]).toEqual({
      sector: 'Health',
      totalUsdM: 14858.6862,
    })
    expect(response.donor?.topRecipients[0]).toMatchObject({
      iso3: expect.any(String),
      name: expect.any(String),
      totalUsdM: expect.any(Number),
    })
    expect(response.donor?.topImplementers[0]).toEqual({
      name: expect.any(String),
      totalUsdM: expect.any(Number),
    })
  })

  it('returns country yearly funding, sector breakdown, counterparties, and concentration metrics', async () => {
    const response = await getDrilldown(new URLSearchParams({
      selectionType: 'country',
      selectionId: 'UKR',
    }))

    expect(response.donor).toBeNull()
    expect(response.country).toMatchObject({
      iso3: 'UKR',
      name: 'Ukraine',
    })
    expect(response.country?.yearlyFunding).toEqual([
      { year: 2020, totalUsdM: 2.1247 },
      { year: 2021, totalUsdM: 6.7884 },
      { year: 2022, totalUsdM: 274.978 },
      { year: 2023, totalUsdM: 379.1678 },
    ])
    expect(response.country?.donorCount).toBeGreaterThan(20)
    expect(response.country?.topDonorShare).toBeGreaterThan(40)
    expect(response.country?.sectorBreakdown[0]).toMatchObject({
      sector: expect.any(String),
      totalUsdM: expect.any(Number),
    })
    expect(response.country?.topDonors[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      country: expect.any(String),
      totalUsdM: expect.any(Number),
    })
    expect(response.country?.topImplementers[0]).toEqual({
      name: expect.any(String),
      totalUsdM: expect.any(Number),
    })
  })

  it('returns the empty drilldown state for an unknown donor selection', async () => {
    const response = await getDrilldown(new URLSearchParams({
      selectionType: 'donor',
      selectionId: 'missing-donor',
    }))

    expect(response).toEqual({
      donor: null,
      country: null,
      donorCountry: null,
    })
  })

  it('returns the empty drilldown state for an unknown country selection', async () => {
    const response = await getDrilldown(new URLSearchParams({
      selectionType: 'country',
      selectionId: 'ZZZ',
    }))

    expect(response).toEqual({
      donor: null,
      country: null,
      donorCountry: null,
    })
  })
})

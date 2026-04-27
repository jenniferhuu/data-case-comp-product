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
    expect(response.donor?.recipientCount).toBe(99)
    expect(response.donor?.topRecipientShare).toBe(6)
    expect(response.donor?.sectorBreakdown[0]).toEqual({
      sector: 'Health',
      totalUsdM: 14858.6862,
    })
    expect(response.donor?.topRecipients[0]).toEqual({
      iso3: 'IND',
      name: 'India',
      totalUsdM: 1133.5824,
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
    expect(response.country?.donorCount).toBe(35)
    expect(response.country?.topDonorShare).toBe(76.1)
    expect(response.country?.sectorBreakdown[0]).toEqual({
      sector: 'Other',
      totalUsdM: 177.9358,
    })
    expect(response.country?.topDonors[0]).toEqual({
      id: 'howard-g-buffett-foundation',
      name: 'Howard G. Buffett Foundation',
      country: 'United States',
      totalUsdM: 504.8489,
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
    })
  })
})

import { describe, expect, it } from 'vitest'
import type { Flow } from '../../types'
import { applyFilters } from '../../lib/filters'
import type { FilterInput } from './derivedData'
import {
  buildFilterParams,
  getFilteredFlows,
  getFlowStats,
  getLeaderboardEntries,
} from './derivedData'
import { getStoreFilterSnapshot, getStoreFilterSnapshotFromState } from './storeFilters'

const makeFlow = (overrides: Partial<Flow> = {}): Flow => ({
  year: 2022,
  donor_id: 'acme_foundation',
  donor_name: 'ACME Foundation',
  donor_country: 'United Kingdom',
  recipient_iso3: 'UKR',
  recipient_name: 'Ukraine',
  usd_disbursed_m: 5,
  n_projects: 2,
  top_sector: 'Emergency',
  growth_rate: 0.3,
  ...overrides,
})

describe('buildFilterParams', () => {
  it('builds canonical params for non-compare mode', () => {
    const params = buildFilterParams({
      yearSelection: 'all',
      donorCountry: 'France',
      sector: 'Education',
      flowSizeMin: 1,
      flowSizeMax: null,
    })

    expect(params.yearSelection).toBe('all')
    expect(params.donorCountry).toBe('France')
    expect(params.sector).toBe('Education')
    expect(params.flowSizeMin).toBe(1)
    expect(params.flowSizeMax).toBeNull()
    expect('compareYears' in params).toBe(false)
  })

  it('builds canonical params for compare mode when compareYears is provided', () => {
    const params = buildFilterParams({
      yearSelection: 'compare',
      compareYears: [2020, 2023],
      donorCountry: null,
      sector: null,
      flowSizeMin: 0,
      flowSizeMax: 25,
    })

    expect(params).toEqual({
      yearSelection: 'compare',
      compareYears: [2020, 2023],
      donorCountry: null,
      sector: null,
      flowSizeMin: 0,
      flowSizeMax: 25,
    })
    expect(params.yearSelection).toBe('compare')
  })

  it('throws when compare mode is missing compareYears', () => {
    const input: FilterInput = {
      yearSelection: 'compare',
      donorCountry: null,
      sector: null,
      flowSizeMin: 0,
      flowSizeMax: 25,
    }
    const buildFilterParamsLoose = buildFilterParams as (input: FilterInput) => ReturnType<typeof buildFilterParams>

    expect(() =>
      buildFilterParamsLoose(input),
    ).toThrow('compareYears is required when yearSelection is "compare"')
  })
})

describe('getFilteredFlows', () => {
  it('filters flows by size and year', () => {
    const data = [
      makeFlow({ year: 2022, usd_disbursed_m: 2 }),
      makeFlow({ year: 2023, usd_disbursed_m: 30 }),
      makeFlow({ year: 2022, donor_country: 'France', usd_disbursed_m: 4 }),
    ]
    const params = buildFilterParams({
      yearSelection: 2022,
      donorCountry: null,
      sector: null,
      flowSizeMin: 0,
      flowSizeMax: 10,
    })

    expect(getFilteredFlows(data, params)).toEqual([data[0], data[2]])
  })

  it('filters compare mode using the provided years', () => {
    const data = [
      makeFlow({ year: 2020, usd_disbursed_m: 2 }),
      makeFlow({ year: 2021, usd_disbursed_m: 3 }),
      makeFlow({ year: 2023, usd_disbursed_m: 4 }),
    ]
    const params = buildFilterParams({
      yearSelection: 'compare',
      compareYears: [2020, 2023],
      donorCountry: null,
      sector: null,
      flowSizeMin: 0,
      flowSizeMax: 25,
    })

    expect(getFilteredFlows(data, params)).toEqual([data[0], data[2]])
  })

  it('rejects compare mode without compareYears at the filter boundary', () => {
    expect(() =>
      applyFilters([makeFlow()], {
        yearSelection: 'compare',
        donorCountry: null,
        sector: null,
        flowSizeMin: 0,
        flowSizeMax: 10,
      } as FilterInput as Parameters<typeof applyFilters>[1]),
    ).toThrow('compareYears is required when yearSelection is "compare"')
  })
})

describe('getFlowStats', () => {
  it('returns count and totalUsd', () => {
    const flows = [makeFlow({ usd_disbursed_m: 2 }), makeFlow({ usd_disbursed_m: 3.5 })]

    expect(getFlowStats(flows)).toEqual({ count: 2, totalUsd: 5.5 })
  })

  it('returns zero stats for no flows', () => {
    expect(getFlowStats([])).toEqual({ count: 0, totalUsd: 0 })
  })
})

describe('getLeaderboardEntries', () => {
  it('returns donor leaderboard entries', () => {
    const flows = [
      makeFlow({ donor_id: 'a', donor_name: 'Alpha', usd_disbursed_m: 2 }),
      makeFlow({ donor_id: 'a', donor_name: 'Alpha', usd_disbursed_m: 1 }),
      makeFlow({ donor_id: 'b', donor_name: 'Beta', usd_disbursed_m: 5 }),
    ]

    expect(getLeaderboardEntries(flows, 'donors', 10)).toEqual([
      { id: 'b', name: 'Beta', total_usd_m: 5, n_flows: 1 },
      { id: 'a', name: 'Alpha', total_usd_m: 3, n_flows: 2 },
    ])
  })

  it('returns country leaderboard entries', () => {
    const flows = [
      makeFlow({ recipient_iso3: 'UKR', recipient_name: 'Ukraine', usd_disbursed_m: 2 }),
      makeFlow({ recipient_iso3: 'UKR', recipient_name: 'Ukraine', usd_disbursed_m: 1 }),
      makeFlow({ recipient_iso3: 'KEN', recipient_name: 'Kenya', usd_disbursed_m: 5 }),
    ]

    expect(getLeaderboardEntries(flows, 'countries', 10)).toEqual([
      { id: 'KEN', name: 'Kenya', total_usd_m: 5, n_flows: 1 },
      { id: 'UKR', name: 'Ukraine', total_usd_m: 3, n_flows: 2 },
    ])
  })
})

describe('derived data alignment', () => {
  it('keeps capped filtered flows, stats, and leaderboards aligned', () => {
    const flows = [
      makeFlow({
        donor_id: 'a',
        donor_name: 'Alpha',
        recipient_iso3: 'UKR',
        recipient_name: 'Ukraine',
        usd_disbursed_m: 9,
      }),
      makeFlow({
        donor_id: 'b',
        donor_name: 'Beta',
        recipient_iso3: 'KEN',
        recipient_name: 'Kenya',
        usd_disbursed_m: 4,
      }),
      makeFlow({
        donor_id: 'c',
        donor_name: 'Gamma',
        recipient_iso3: 'UGA',
        recipient_name: 'Uganda',
        usd_disbursed_m: 12,
      }),
    ]

    const params = buildFilterParams({
      yearSelection: 'all',
      donorCountry: null,
      sector: null,
      flowSizeMin: 0,
      flowSizeMax: 10,
    })

    const filtered = getFilteredFlows(flows, params)
    const stats = getFlowStats(filtered)
    const donorLeaderboard = getLeaderboardEntries(filtered, 'donors', 10)
    const countryLeaderboard = getLeaderboardEntries(filtered, 'countries', 10)

    expect(filtered).toEqual([flows[0], flows[1]])
    expect(stats).toEqual({ count: 2, totalUsd: 13 })
    expect(donorLeaderboard).toEqual([
      { id: 'a', name: 'Alpha', total_usd_m: 9, n_flows: 1 },
      { id: 'b', name: 'Beta', total_usd_m: 4, n_flows: 1 },
    ])
    expect(countryLeaderboard).toEqual([
      { id: 'UKR', name: 'Ukraine', total_usd_m: 9, n_flows: 1 },
      { id: 'KEN', name: 'Kenya', total_usd_m: 4, n_flows: 1 },
    ])
  })

  it('keeps store-shaped compare filters aligned across filtered flows, stats, and leaderboards', () => {
    const flows = [
      makeFlow({ year: 2020, donor_id: 'a', donor_name: 'Alpha', recipient_iso3: 'UKR', recipient_name: 'Ukraine', usd_disbursed_m: 9 }),
      makeFlow({ year: 2023, donor_id: 'a', donor_name: 'Alpha', recipient_iso3: 'UKR', recipient_name: 'Ukraine', usd_disbursed_m: 4 }),
      makeFlow({ year: 2023, donor_id: 'b', donor_name: 'Beta', recipient_iso3: 'KEN', recipient_name: 'Kenya', usd_disbursed_m: 12 }),
    ]

    const params = getStoreFilterSnapshotFromState({
      yearSelection: 'compare',
      compareYears: [2020, 2023],
      donorCountry: null,
      sector: null,
      flowSizeMin: 0,
      flowSizeMax: 10,
    })

    const filtered = getFilteredFlows(flows, params)
    const stats = getFlowStats(filtered)
    const donorLeaderboard = getLeaderboardEntries(filtered, 'donors', 10)

    expect(filtered).toEqual([flows[0], flows[1]])
    expect(stats).toEqual({ count: 2, totalUsd: 13 })
    expect(donorLeaderboard).toEqual([
      { id: 'a', name: 'Alpha', total_usd_m: 13, n_flows: 2 },
    ])
  })
})

describe('store filter snapshots', () => {
  it('builds canonical filter params directly from store-shaped state', () => {
    const snapshot = getStoreFilterSnapshotFromState({
      yearSelection: 'compare',
      compareYears: [2020, 2023],
      donorCountry: 'France',
      sector: 'Education',
      flowSizeMin: 3,
      flowSizeMax: 11,
    })

    expect(snapshot).toEqual({
      yearSelection: 'compare',
      compareYears: [2020, 2023],
      donorCountry: 'France',
      sector: 'Education',
      flowSizeMin: 3,
      flowSizeMax: 11,
    })
  })

  it('builds canonical filter params from compare filter state including max cap', () => {
    const snapshot = getStoreFilterSnapshot({
      yearSelection: 'compare',
      compareYears: [2020, 2023],
      donorCountry: 'France',
      sector: 'Education',
      flowSizeMin: 3,
      flowSizeMax: 11,
    })

    expect(snapshot).toEqual({
      yearSelection: 'compare',
      compareYears: [2020, 2023],
      donorCountry: 'France',
      sector: 'Education',
      flowSizeMin: 3,
      flowSizeMax: 11,
    })
  })

  it('builds canonical filter params from non-compare filter state without compareYears', () => {
    const snapshot = getStoreFilterSnapshot({
      yearSelection: 2022,
      donorCountry: null,
      sector: 'Health',
      flowSizeMin: 2,
      flowSizeMax: null,
    })

    expect(snapshot).toEqual({
      yearSelection: 2022,
      donorCountry: null,
      sector: 'Health',
      flowSizeMin: 2,
      flowSizeMax: null,
    })
    expect('compareYears' in snapshot).toBe(false)
  })

  it('throws when compare snapshot input is missing compareYears', () => {
    expect(() =>
      getStoreFilterSnapshot({
        yearSelection: 'compare',
        donorCountry: null,
        sector: null,
        flowSizeMin: 0,
        flowSizeMax: 10,
      } as FilterInput as Parameters<typeof getStoreFilterSnapshot>[0]),
    ).toThrow('compareYears is required when yearSelection is "compare"')
  })
})

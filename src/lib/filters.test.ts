// src/lib/filters.test.ts
import { describe, it, expect } from 'vitest'
import { applyFilters, getLeaderboardDonors, getLeaderboardCountries } from './filters'
import type { Flow } from '../types'

const makeFlow = (overrides: Partial<Flow> = {}): Flow => ({
  year: 2022,
  donor_id: 'acme_foundation',
  donor_name: 'ACME Foundation',
  donor_country: 'United Kingdom',
  recipient_iso3: 'UKR',
  recipient_name: 'Ukraine',
  usd_disbursed_m: 5.0,
  n_projects: 2,
  top_sector: 'Emergency',
  growth_rate: 0.3,
  ...overrides,
})

const flows: Flow[] = [
  makeFlow({ year: 2022, donor_country: 'United Kingdom', top_sector: 'Emergency', usd_disbursed_m: 5 }),
  makeFlow({ year: 2021, donor_country: 'France', top_sector: 'Education', usd_disbursed_m: 2 }),
  makeFlow({ year: 2020, donor_country: 'United Kingdom', top_sector: 'Health', usd_disbursed_m: 0.005, recipient_iso3: 'KEN' }),
]

describe('applyFilters', () => {
  it('returns all flows when no filters set', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: null, sector: null, flowSizeMin: 0 })
    expect(result).toHaveLength(3)
  })

  it('filters by single year', () => {
    const result = applyFilters(flows, { yearSelection: 2022, donorCountry: null, sector: null, flowSizeMin: 0 })
    expect(result).toHaveLength(1)
    expect(result[0].year).toBe(2022)
  })

  it('filters by donor country', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: 'France', sector: null, flowSizeMin: 0 })
    expect(result).toHaveLength(1)
    expect(result[0].donor_country).toBe('France')
  })

  it('filters by sector', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: null, sector: 'Emergency', flowSizeMin: 0 })
    expect(result).toHaveLength(1)
    expect(result[0].top_sector).toBe('Emergency')
  })

  it('filters by flowSizeMin', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: null, sector: null, flowSizeMin: 1.0 })
    expect(result).toHaveLength(2)
    result.forEach(f => expect(f.usd_disbursed_m).toBeGreaterThanOrEqual(1.0))
  })

  it('combines multiple filters', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: 'United Kingdom', sector: 'Emergency', flowSizeMin: 1.0 })
    expect(result).toHaveLength(1)
  })
})

describe('getLeaderboardDonors', () => {
  it('returns top donors sorted by total usd', () => {
    const result = getLeaderboardDonors(flows, 10)
    expect(result[0].total_usd_m).toBeGreaterThanOrEqual(result[1]?.total_usd_m ?? 0)
  })
})

describe('getLeaderboardCountries', () => {
  it('returns top countries sorted by total received', () => {
    const result = getLeaderboardCountries(flows, 10)
    expect(result.length).toBeGreaterThan(0)
    if (result.length > 1) {
      expect(result[0].total_usd_m).toBeGreaterThanOrEqual(result[1].total_usd_m)
    }
  })
})

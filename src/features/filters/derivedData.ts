import type { Flow, YearSelection } from '../../types'
import {
  applyFilters,
  getLeaderboardCountries,
  getLeaderboardDonors,
  type LeaderboardEntry,
} from '../../lib/filters'

type BaseFilterParams = {
  yearSelection: YearSelection
  donorCountry: string | null
  sector: string | null
  flowSizeMin: number
  flowSizeMax: number | null
}

export interface FilterInput {
  yearSelection: YearSelection
  compareYears?: [number, number]
  donorCountry: string | null
  sector: string | null
  flowSizeMin: number
  flowSizeMax: number | null
}

export type CompareFilterInput = Omit<FilterInput, 'yearSelection' | 'compareYears'> & {
  yearSelection: 'compare'
  compareYears: [number, number]
}

export type NonCompareFilterInput = Omit<FilterInput, 'yearSelection' | 'compareYears'> & {
  yearSelection: Exclude<YearSelection, 'compare'>
  compareYears?: never
}

export type CanonicalFilterParams = BaseFilterParams & (
  | { yearSelection: 'compare'; compareYears: [number, number] }
  | { yearSelection: Exclude<YearSelection, 'compare'>; compareYears?: never }
)

export function buildFilterParams(input: CompareFilterInput): Extract<CanonicalFilterParams, { yearSelection: 'compare' }>
export function buildFilterParams(input: NonCompareFilterInput): Extract<CanonicalFilterParams, { yearSelection: Exclude<YearSelection, 'compare'> }>
export function buildFilterParams(input: FilterInput): CanonicalFilterParams {
  if (input.yearSelection === 'compare' && !input.compareYears) {
    throw new Error('compareYears is required when yearSelection is "compare"')
  }

  if (input.yearSelection === 'compare') {
    return {
      yearSelection: 'compare',
      compareYears: input.compareYears!,
      donorCountry: input.donorCountry,
      sector: input.sector,
      flowSizeMin: input.flowSizeMin,
      flowSizeMax: input.flowSizeMax,
    }
  }

  return {
    yearSelection: input.yearSelection as Exclude<YearSelection, 'compare'>,
    donorCountry: input.donorCountry,
    sector: input.sector,
    flowSizeMin: input.flowSizeMin,
    flowSizeMax: input.flowSizeMax,
  }
}

export function getFilteredFlows(data: Flow[], params: CanonicalFilterParams): Flow[] {
  return applyFilters(data, params)
}

export function getFlowStats(flows: Flow[]): { count: number; totalUsd: number } {
  return {
    count: flows.length,
    totalUsd: flows.reduce((sum, flow) => sum + flow.usd_disbursed_m, 0),
  }
}

export function getLeaderboardEntries(
  flows: Flow[],
  kind: 'donors' | 'countries',
  topN: number,
): LeaderboardEntry[] {
  return kind === 'donors'
    ? getLeaderboardDonors(flows, topN)
    : getLeaderboardCountries(flows, topN)
}

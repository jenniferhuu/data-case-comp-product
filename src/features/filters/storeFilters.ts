import { useStore } from '../../state/store'
import { buildFilterParams, type CanonicalFilterParams } from './derivedData'

type StoreFilterBase = {
  donorCountry: string | null
  sector: string | null
  flowSizeMin: number
  flowSizeMax: number | null
}

export type StoreCompareFilterInput = StoreFilterBase & {
  yearSelection: 'compare'
  compareYears: [number, number]
}

export type StoreNonCompareFilterInput = StoreFilterBase & {
  yearSelection: Exclude<CanonicalFilterParams['yearSelection'], 'compare'>
  compareYears?: never
}

export type StoreFilterSnapshotInput = StoreCompareFilterInput | StoreNonCompareFilterInput

export type StoreFilterState = StoreFilterBase & {
  yearSelection: CanonicalFilterParams['yearSelection']
  compareYears: [number, number]
}

export function getStoreFilterSnapshot(state: StoreCompareFilterInput): Extract<CanonicalFilterParams, { yearSelection: 'compare' }>
export function getStoreFilterSnapshot(state: StoreNonCompareFilterInput): Extract<CanonicalFilterParams, { yearSelection: Exclude<CanonicalFilterParams['yearSelection'], 'compare'> }>
export function getStoreFilterSnapshot(state: StoreFilterSnapshotInput): CanonicalFilterParams {
  return state.yearSelection === 'compare'
    ? buildFilterParams(state)
    : buildFilterParams(state)
}

export function getStoreFilterSnapshotFromState(state: StoreFilterState): CanonicalFilterParams {
  return state.yearSelection === 'compare'
    ? getStoreFilterSnapshot({
        yearSelection: 'compare',
        compareYears: state.compareYears,
        donorCountry: state.donorCountry,
        sector: state.sector,
        flowSizeMin: state.flowSizeMin,
        flowSizeMax: state.flowSizeMax,
      })
    : getStoreFilterSnapshot({
        yearSelection: state.yearSelection,
        donorCountry: state.donorCountry,
        sector: state.sector,
        flowSizeMin: state.flowSizeMin,
        flowSizeMax: state.flowSizeMax,
      })
}

export function useStoreFilterSnapshot(): CanonicalFilterParams {
  const filterState = useStore((state) => ({
    yearSelection: state.yearSelection,
    compareYears: state.compareYears,
    donorCountry: state.donorCountry,
    sector: state.sector,
    flowSizeMin: state.flowSizeMin,
    flowSizeMax: state.flowSizeMax,
  }))

  return getStoreFilterSnapshotFromState(filterState)
}

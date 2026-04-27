'use client'

import { create } from 'zustand'
import type { DashboardQuery } from '../../contracts/filters'
import { mergeDashboardQuery, parseDashboardQuery } from './queryState'

export interface GlobeStats {
  visibleFundingUsdM: number
  arcCount: number
  pointCount: number
}

export interface DashboardState extends DashboardQuery {
  idleMode: boolean
  selectedCountryIso3: string | null
  selectedDonorId: string | null
  globeStats: GlobeStats | null
  hydrateFromQuery: (query: DashboardQuery) => void
  patchQuery: (query: Partial<DashboardQuery>) => void
  resetSelection: () => void
  selectCountry: (iso3: string | null) => void
  selectDonor: (id: string | null) => void
  setIdleMode: (value: boolean) => void
  setGlobeStats: (stats: GlobeStats) => void
}

const defaultQuery = parseDashboardQuery()
const clearedQueryState: Partial<DashboardQuery> = {
  year: undefined,
  compareFrom: undefined,
  compareTo: undefined,
  donor: undefined,
  donorCountry: undefined,
  recipientCountry: undefined,
  sector: undefined,
  marker: undefined,
  selectionType: undefined,
  selectionId: undefined,
}

function deriveSelectionState(query: Partial<DashboardQuery>) {
  if (query.selectionType === 'country') {
    return {
      selectedCountryIso3: query.selectionId ?? null,
      selectedDonorId: null,
    }
  }

  if (query.selectionType === 'donor') {
    return {
      selectedCountryIso3: null,
      selectedDonorId: query.selectionId ?? null,
    }
  }

  return {
    selectedCountryIso3: null,
    selectedDonorId: null,
  }
}

function deriveIdleMode(query: Partial<DashboardQuery>) {
  return query.selectionType === undefined
}

export const useDashboardState = create<DashboardState>((set) => ({
  ...defaultQuery,
  idleMode: true,
  selectedCountryIso3: null,
  selectedDonorId: null,
  globeStats: null,
  hydrateFromQuery: (query) => {
    const nextQuery = parseDashboardQuery(query)

    set({
      ...clearedQueryState,
      ...nextQuery,
      ...deriveSelectionState(nextQuery),
      idleMode: deriveIdleMode(nextQuery),
    })
  },
  patchQuery: (query) => {
    set((state) => {
      const nextQuery = mergeDashboardQuery(state, query)

      return {
        ...nextQuery,
        ...deriveSelectionState(nextQuery),
        idleMode: deriveIdleMode(nextQuery),
      }
    })
  },
  resetSelection: () => {
    set({
      selectionType: undefined,
      selectionId: undefined,
      selectedCountryIso3: null,
      selectedDonorId: null,
      idleMode: true,
    })
  },
  selectCountry: (selectedCountryIso3) => {
    set({
      selectionType: selectedCountryIso3 === null ? undefined : 'country',
      selectionId: selectedCountryIso3 ?? undefined,
      selectedCountryIso3,
      selectedDonorId: null,
      idleMode: selectedCountryIso3 === null,
    })
  },
  selectDonor: (selectedDonorId) => {
    set({
      selectionType: selectedDonorId === null ? undefined : 'donor',
      selectionId: selectedDonorId ?? undefined,
      selectedDonorId,
      selectedCountryIso3: null,
      idleMode: selectedDonorId === null,
    })
  },
  setIdleMode: (idleMode) => set({ idleMode }),
  setGlobeStats: (globeStats) => set({ globeStats }),
}))

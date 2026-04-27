import { create } from 'zustand'
import type { Mode, YearSelection, MarkerKey } from '../types'
import {
  applyGlobeSelectionState,
  clearSelectionState,
  selectCountryState,
  selectDonorState,
} from '../features/selection/selectionActions'
import type { GlobeSelectionState } from '../lib/globeSelection'

interface AppState {
  // Mode
  mode: Mode
  setMode: (m: Mode) => void

  // Year controls
  yearSelection: YearSelection
  setYearSelection: (y: YearSelection) => void
  compareYears: [number, number]
  setCompareYears: (years: [number, number]) => void

  // Filters
  donorCountry: string | null
  setDonorCountry: (c: string | null) => void
  sector: string | null
  setSector: (s: string | null) => void
  flowSizeMin: number
  setFlowSizeMin: (n: number) => void
  flowSizeMax: number | null
  setFlowSizeMax: (n: number | null) => void

  // Credibility mode
  selectedMarker: MarkerKey
  setSelectedMarker: (m: MarkerKey) => void

  // Drilldown panels
  selectedDonorId: string | null
  selectedCountryIso3: string | null
  selectDonor: (id: string | null) => void
  selectCountry: (iso3: string | null) => void
  clearSelection: () => void
  applyGlobeSelection: (nextSelection: GlobeSelectionState) => void
}

export const useStore = create<AppState>((set) => ({
  mode: 'crisis',
  setMode: (mode) => set({ mode }),

  yearSelection: 'all',
  setYearSelection: (yearSelection) => set({ yearSelection }),
  compareYears: [2020, 2023],
  setCompareYears: (compareYears) => set({ compareYears }),

  donorCountry: null,
  setDonorCountry: (donorCountry) => set({ donorCountry }),
  sector: null,
  setSector: (sector) => set({ sector }),
  flowSizeMin: 1,
  setFlowSizeMin: (flowSizeMin) => set({ flowSizeMin }),
  flowSizeMax: null,
  setFlowSizeMax: (flowSizeMax) => set({ flowSizeMax }),

  selectedMarker: 'gender',
  setSelectedMarker: (selectedMarker) => set({ selectedMarker }),

  selectedDonorId: null,
  selectedCountryIso3: null,
  selectDonor: (donorId) => set((state) => selectDonorState(state, donorId)),
  selectCountry: (iso3) => set((state) => selectCountryState(state, iso3)),
  clearSelection: () => set((state) => clearSelectionState(state)),
  applyGlobeSelection: (nextSelection) =>
    set((state) => applyGlobeSelectionState(state, nextSelection)),
}))

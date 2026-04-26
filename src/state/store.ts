import { create } from 'zustand'
import type { Mode, YearSelection, MarkerKey } from '../types'

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

  // Credibility mode
  selectedMarker: MarkerKey
  setSelectedMarker: (m: MarkerKey) => void

  // Drilldown panels
  selectedDonorId: string | null
  setSelectedDonorId: (id: string | null) => void
  selectedCountryIso3: string | null
  setSelectedCountryIso3: (iso3: string | null) => void
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
  flowSizeMin: 0.01,
  setFlowSizeMin: (flowSizeMin) => set({ flowSizeMin }),

  selectedMarker: 'gender',
  setSelectedMarker: (selectedMarker) => set({ selectedMarker }),

  selectedDonorId: null,
  setSelectedDonorId: (selectedDonorId) => set({ selectedDonorId }),
  selectedCountryIso3: null,
  setSelectedCountryIso3: (selectedCountryIso3) => set({ selectedCountryIso3 }),
}))

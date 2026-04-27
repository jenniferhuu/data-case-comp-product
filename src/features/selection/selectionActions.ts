import type { GlobeSelectionState } from '../../lib/globeSelection'

export interface DrilldownSelectionState {
  selectedDonorId: string | null
  selectedCountryIso3: string | null
}

export interface SelectionState extends DrilldownSelectionState {
  donorCountry: string | null
}

export function selectDonorState(state: DrilldownSelectionState, donorId: string | null): DrilldownSelectionState {
  return {
    ...state,
    selectedDonorId: donorId,
    selectedCountryIso3: null,
  }
}

export function selectCountryState(state: DrilldownSelectionState, iso3: string | null): DrilldownSelectionState {
  return {
    ...state,
    selectedDonorId: null,
    selectedCountryIso3: iso3,
  }
}

export function clearSelectionState(state: DrilldownSelectionState): DrilldownSelectionState {
  return {
    ...state,
    selectedDonorId: null,
    selectedCountryIso3: null,
  }
}

export function applyGlobeSelectionState(
  currentSelection: SelectionState,
  nextSelection: GlobeSelectionState,
): SelectionState {
  return {
    ...currentSelection,
    ...nextSelection,
  }
}

import { describe, expect, it } from 'vitest'
import {
  applyGlobeSelectionState,
  clearSelectionState,
  selectCountryState,
  selectDonorState,
} from './selectionActions'

describe('selectionActions', () => {
  it('selectDonorState selects the donor and clears the country selection while preserving donorCountry', () => {
    const state = {
      selectedDonorId: null,
      selectedCountryIso3: 'KEN',
    }

    expect(selectDonorState(state, 'gates_foundation')).toEqual({
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: null,
    })
  })

  it('selectDonorState accepts null to clear donor and country selection while preserving donorCountry', () => {
    const state = {
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: 'KEN',
    }

    expect(selectDonorState(state, null)).toEqual({
      selectedDonorId: null,
      selectedCountryIso3: null,
    })
  })

  it('selectCountryState selects the country, clears donor selection, and preserves donorCountry', () => {
    const state = {
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: null,
    }

    expect(selectCountryState(state, 'KEN')).toEqual({
      selectedDonorId: null,
      selectedCountryIso3: 'KEN',
    })
  })

  it('selectCountryState accepts null to clear donor and country selection while preserving donorCountry', () => {
    const state = {
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: 'KEN',
    }

    expect(selectCountryState(state, null)).toEqual({
      selectedDonorId: null,
      selectedCountryIso3: null,
    })
  })

  it('clearSelectionState clears selected donor and country only, preserving donorCountry', () => {
    const state = {
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: 'KEN',
    }

    expect(clearSelectionState(state)).toEqual({
      selectedDonorId: null,
      selectedCountryIso3: null,
    })
  })

  it('applyGlobeSelectionState applies a resolved donor selection to the current selection state', () => {
    const state = {
      selectedDonorId: null,
      donorCountry: 'France',
      selectedCountryIso3: 'KEN',
    }

    expect(
      applyGlobeSelectionState(state, {
        selectedDonorId: 'wellcome_trust',
        donorCountry: 'United Kingdom',
        selectedCountryIso3: null,
      }),
    ).toEqual({
      selectedDonorId: 'wellcome_trust',
      donorCountry: 'United Kingdom',
      selectedCountryIso3: null,
    })
  })

  it('applyGlobeSelectionState applies a resolved country selection with donorCountry cleared', () => {
    const state = {
      selectedDonorId: 'wellcome_trust',
      donorCountry: 'United Kingdom',
      selectedCountryIso3: null,
    }

    expect(
      applyGlobeSelectionState(state, {
        selectedDonorId: null,
        donorCountry: null,
        selectedCountryIso3: 'KEN',
      }),
    ).toEqual({
      selectedDonorId: null,
      donorCountry: null,
      selectedCountryIso3: 'KEN',
    })
  })

  it('applyGlobeSelectionState applies a resolved country selection from a different donor country', () => {
    const state = {
      selectedDonorId: 'wellcome_trust',
      donorCountry: 'France',
      selectedCountryIso3: null,
    }

    expect(
      applyGlobeSelectionState(state, {
        selectedDonorId: null,
        donorCountry: null,
        selectedCountryIso3: 'KEN',
      }),
    ).toEqual({
      selectedDonorId: null,
      donorCountry: null,
      selectedCountryIso3: 'KEN',
    })
  })

  it('applyGlobeSelectionState clears donor, country, and donorCountry for an empty globe selection', () => {
    const state = {
      selectedDonorId: 'wellcome_trust',
      donorCountry: 'France',
      selectedCountryIso3: 'KEN',
    }

    expect(
      applyGlobeSelectionState(state, {
        selectedDonorId: null,
        donorCountry: null,
        selectedCountryIso3: null,
      }),
    ).toEqual({
      selectedDonorId: null,
      donorCountry: null,
      selectedCountryIso3: null,
    })
  })
})

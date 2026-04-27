import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'

const initialState = {
  mode: 'crisis' as const,
  yearSelection: 'all' as const,
  compareYears: [2020, 2023] as [number, number],
  donorCountry: null as string | null,
  sector: null as string | null,
  flowSizeMin: 1,
  flowSizeMax: null as number | null,
  selectedMarker: 'gender' as const,
  selectedDonorId: null as string | null,
  selectedCountryIso3: null as string | null,
}

beforeEach(() => {
  useStore.setState(initialState)
})

describe('useStore selection actions', () => {
  it('selectDonor updates donor selection and clears country selection', () => {
    useStore.getState().selectDonor('gates_foundation')

    expect(useStore.getState()).toMatchObject({
      mode: 'crisis',
      yearSelection: 'all',
      compareYears: [2020, 2023],
      selectedMarker: 'gender',
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: null,
      donorCountry: null,
    })
  })

  it('selectDonor accepts null to clear donor and country selection', () => {
    useStore.setState({
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: 'KEN',
      donorCountry: 'France',
    })

    useStore.getState().selectDonor(null)

    expect(useStore.getState()).toMatchObject({
      selectedDonorId: null,
      selectedCountryIso3: null,
      donorCountry: 'France',
    })
  })

  it('selectCountry updates country selection and clears donor selection', () => {
    useStore.getState().selectCountry('KEN')

    expect(useStore.getState()).toMatchObject({
      selectedDonorId: null,
      selectedCountryIso3: 'KEN',
      donorCountry: null,
    })
  })

  it('selectCountry accepts null to clear donor and country selection', () => {
    useStore.setState({
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: 'KEN',
      donorCountry: 'France',
    })

    useStore.getState().selectCountry(null)

    expect(useStore.getState()).toMatchObject({
      mode: 'crisis',
      yearSelection: 'all',
      compareYears: [2020, 2023],
      selectedMarker: 'gender',
      selectedDonorId: null,
      selectedCountryIso3: null,
      donorCountry: 'France',
    })
  })

  it('clearSelection clears the selection fields only', () => {
    useStore.setState({
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: 'KEN',
      donorCountry: 'France',
    })

    useStore.getState().clearSelection()

    expect(useStore.getState()).toMatchObject({
      mode: 'crisis',
      yearSelection: 'all',
      compareYears: [2020, 2023],
      selectedMarker: 'gender',
      selectedDonorId: null,
      selectedCountryIso3: null,
      donorCountry: 'France',
    })
  })

  it('applyGlobeSelection applies the resolved globe selection snapshot', () => {
    useStore.setState({
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: 'KEN',
      donorCountry: 'France',
    })

    useStore.getState().applyGlobeSelection({
      selectedDonorId: null,
      selectedCountryIso3: 'KEN',
      donorCountry: null,
    })

    expect(useStore.getState()).toMatchObject({
      mode: 'crisis',
      yearSelection: 'all',
      compareYears: [2020, 2023],
      selectedMarker: 'gender',
      selectedDonorId: null,
      selectedCountryIso3: 'KEN',
      donorCountry: null,
    })
  })

  it('applyGlobeSelection clears donorCountry atomically with an empty globe selection', () => {
    useStore.setState({
      selectedDonorId: 'gates_foundation',
      selectedCountryIso3: 'KEN',
      donorCountry: 'France',
    })

    useStore.getState().applyGlobeSelection({
      selectedDonorId: null,
      selectedCountryIso3: null,
      donorCountry: null,
    })

    expect(useStore.getState()).toMatchObject({
      selectedDonorId: null,
      selectedCountryIso3: null,
      donorCountry: null,
    })
  })
})

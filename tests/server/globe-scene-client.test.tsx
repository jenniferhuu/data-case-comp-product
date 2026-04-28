// @vitest-environment jsdom
import React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GlobeScene } from '../../src/components/Globe/GlobeScene'
import { parseDashboardQuery } from '../../src/features/dashboard/queryState'
import { useDashboardState } from '../../src/features/dashboard/useDashboardState'

vi.mock('next/dynamic', () => ({
  default: (_loader: unknown, _options: unknown) => function GlobeStub(props: {
    onPointClick?: (point: object) => void
    onGlobeClick?: (coords: { lat: number, lng: number }) => void
    onPolygonClick?: (feature: object) => void
    polygonStrokeColor?: (feature: object) => string
    polygonsData?: Array<{
      properties?: {
        iso_a3?: string
        name?: string
      }
    }>
    arcsData?: Array<{
      donorId?: string
      donorName?: string
      donorCountry?: string
      donorLat?: number
      donorLon?: number
      recipientIso3?: string
      recipientName?: string
      recipientLat?: number
      recipientLon?: number
      amountUsdM?: number
      yearAmounts?: Array<{ year: number, totalUsdM: number }>
      years?: number[]
    }>
    arcColor?: (arc: object) => string[]
  }) {
    const firstArc = props.arcsData?.[0]
    const compareColor = firstArc === undefined || props.arcColor === undefined
      ? ''
      : props.arcColor(firstArc).join('|')

    return (
      <div>
        <button
          data-testid="globe-stub"
          type="button"
          onClick={() => props.onPointClick?.(props.pointsData?.[0] ?? {
            iso3: 'UKR',
            name: 'Ukraine',
            totalUsdM: 663.1,
            donorCount: 35,
          })}
        >
          globe stub
        </button>
        <button
          data-testid="globe-click-donor-stub"
          type="button"
          onClick={() => props.onGlobeClick?.({ lat: 37.1, lng: -95.7 })}
        >
          globe click donor stub
        </button>
        <button
          data-testid="globe-click-country-polygon-stub"
          type="button"
          onClick={() => props.onPolygonClick?.(props.polygonsData?.[0] ?? { properties: { iso_a3: 'UKR', name: 'Ukraine' } })}
        >
          globe click country polygon stub
        </button>
        <button
          data-testid="globe-click-country-polygon-stub-2"
          type="button"
          onClick={() => props.onPolygonClick?.(props.polygonsData?.[1] ?? { properties: { iso_a3: 'USA', name: 'United States' } })}
        >
          globe click country polygon stub 2
        </button>
        <div data-testid="compare-color">{compareColor}</div>
        <div data-testid="arc-count">{props.arcsData?.length ?? 0}</div>
        {(props.polygonsData ?? []).map((feature, index) => (
          <div key={feature.properties?.iso_a3 ?? index} data-testid={`polygon-stroke-${index}`}>
            {props.polygonStrokeColor?.(feature) ?? ''}
          </div>
        ))}
      </div>
    )
  },
}))

function createFiltersResponse(donorCountries: string[] = []) {
  return {
    donors: [],
    donorCountries,
    recipientCountries: [],
    sectors: [],
    years: [],
    markers: [],
    donorIdMap: {},
    recipientCountryIsoMap: {},
  }
}

describe('GlobeScene client state', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    useDashboardState.setState({
      ...parseDashboardQuery(),
      idleMode: true,
      selectedCountryIso3: null,
      selectedDonorId: null,
    })
    class ResizeObserverStub {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('surfaces a globe unavailable message when the globe request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: false,
          json: async () => ({
            message: 'Globe data is unavailable.',
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Globe data is unavailable.')
    expect(useDashboardState.getState().globeStats).toEqual({
      visibleFundingUsdM: 0,
      arcCount: 0,
      pointCount: 0,
      crossBorderPct: 0,
      domesticPct: 0,
    })
  })

  it('shows compare-mode legend guidance when year mode is compare', async () => {
    useDashboardState.setState({
      ...parseDashboardQuery(),
      yearMode: 'compare',
      compareFrom: 2020,
      compareTo: 2023,
      idleMode: false,
      selectedCountryIso3: null,
      selectedDonorId: null,
    })

    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [
              {
                donorId: 'gates-foundation',
                donorName: 'Gates Foundation',
                donorCountry: 'United States',
                donorLat: 0,
                donorLon: 0,
                recipientIso3: 'UKR',
                recipientName: 'Ukraine',
                recipientLat: 1,
                recipientLon: 1,
                amountUsdM: 15,
                years: [2020, 2023],
                yearAmounts: [
                  { year: 2020, totalUsdM: 5 },
                  { year: 2023, totalUsdM: 10 },
                ],
                sector: 'Health',
              },
            ],
            points: [],
            visibleFundingUsdM: 15,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(['United States']),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Green = positive delta')
    expect(container.textContent).toContain('neutral midpoint')
    expect(container.querySelector('[data-testid="compare-color"]')?.textContent).toBe('#86efac|#22c55e')
  })

  it('keeps country selection available from recipient point clicks', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [],
            points: [
              {
                iso3: 'UKR',
                name: 'Ukraine',
                lat: 49,
                lon: 32,
                totalUsdM: 663.1,
                donorCount: 35,
              },
            ],
            visibleFundingUsdM: 663.1,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                properties: {
                  iso_a3: 'UKR',
                  name: 'Ukraine',
                },
              },
            ],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    const trigger = container.querySelector('[data-testid="globe-stub"]')

    expect(trigger).not.toBeNull()

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const state = useDashboardState.getState()

    expect(state.selectionType).toBe('country')
    expect(state.selectionId).toBe('UKR')
    expect(state.selectedCountryIso3).toBe('UKR')
    expect(state.selectedDonorId).toBeNull()
    expect(state.idleMode).toBe(false)
  })

  it('updates the recipient-country filter when a different country is clicked after an existing selection', async () => {
    useDashboardState.setState({
      ...parseDashboardQuery(),
      recipientCountry: 'Ukraine',
      selectionType: 'country',
      selectionId: 'UKR',
      selectedCountryIso3: 'UKR',
      idleMode: false,
    })

    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [],
            points: [
              {
                iso3: 'KEN',
                name: 'Kenya',
                lat: -0.02,
                lon: 37.91,
                totalUsdM: 128.4,
                donorCount: 14,
              },
            ],
            visibleFundingUsdM: 128.4,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                properties: {
                  iso_a3: 'KEN',
                  name: 'Kenya',
                },
              },
            ],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    const trigger = container.querySelector('[data-testid="globe-stub"]')

    expect(trigger).not.toBeNull()

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const state = useDashboardState.getState()

    expect(state.selectionType).toBe('country')
    expect(state.selectionId).toBe('KEN')
    expect(state.selectedCountryIso3).toBe('KEN')
    expect(state.recipientCountry).toBe('Kenya')
    expect(state.selectedDonorId).toBeNull()
    expect(state.idleMode).toBe(false)
  })

  it('allows clicking within country polygons to focus that country', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [],
            points: [
              {
                iso3: 'UKR',
                name: 'Ukraine',
                lat: 49,
                lon: 32,
                totalUsdM: 663.1,
                donorCount: 35,
              },
            ],
            visibleFundingUsdM: 663.1,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                properties: {
                  iso_a3: 'UKR',
                  name: 'Ukraine',
                },
              },
            ],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    const trigger = container.querySelector('[data-testid="globe-click-country-polygon-stub"]')

    expect(trigger).not.toBeNull()

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const state = useDashboardState.getState()

    expect(state.selectionType).toBe('country')
    expect(state.selectionId).toBe('UKR')
    expect(state.selectedCountryIso3).toBe('UKR')
    expect(state.selectedDonorId).toBeNull()
    expect(state.idleMode).toBe(false)
  })

  it('routes donor-country polygon clicks into donor-country drilldowns', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [
              {
                donorId: 'gates-foundation',
                donorName: 'Gates Foundation',
                donorCountry: 'United States',
                donorLat: 37.09,
                donorLon: -95.71,
                recipientIso3: 'UKR',
                recipientName: 'Ukraine',
                recipientLat: 49,
                recipientLon: 32,
                amountUsdM: 663.1,
                years: [2023],
                yearAmounts: [{ year: 2023, totalUsdM: 663.1 }],
                sector: 'Health',
              },
            ],
            points: [],
            visibleFundingUsdM: 663.1,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                properties: {
                  iso_a3: 'USA',
                  name: 'United States',
                },
              },
            ],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(['United States']),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    const trigger = container.querySelector('[data-testid="globe-click-country-polygon-stub"]')

    expect(trigger).not.toBeNull()

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const state = useDashboardState.getState()

    expect(state.selectionType).toBe('donorCountry')
    expect(state.selectionId).toBe('United States')
    expect(state.donorCountry).toBe('United States')
    expect(state.selectedCountryIso3).toBeNull()
    expect(state.selectedDonorId).toBeNull()
    expect(state.idleMode).toBe(false)
  })

  it('allows map clicks near donor origins to focus donor drilldowns', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [
              {
                donorId: 'gates-foundation',
                donorName: 'Gates Foundation',
                donorCountry: 'United States',
                donorLat: 37.09,
                donorLon: -95.71,
                recipientIso3: 'UKR',
                recipientName: 'Ukraine',
                recipientLat: 49,
                recipientLon: 32,
                amountUsdM: 663.1,
                years: [2023],
                yearAmounts: [{ year: 2023, totalUsdM: 663.1 }],
                sector: 'Health',
              },
            ],
            points: [
              {
                iso3: 'UKR',
                name: 'Ukraine',
                lat: 49,
                lon: 32,
                totalUsdM: 663.1,
                donorCount: 35,
              },
            ],
            visibleFundingUsdM: 663.1,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(['United States']),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    const trigger = container.querySelector('[data-testid="globe-click-donor-stub"]')

    expect(trigger).not.toBeNull()

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const state = useDashboardState.getState()

    expect(state.selectionType).toBe('donor')
    expect(state.selectionId).toBe('gates-foundation')
    expect(state.selectedDonorId).toBe('gates-foundation')
    expect(state.selectedCountryIso3).toBeNull()
    expect(state.idleMode).toBe(false)
  })

  it('highlights recipient countries when a donor-country selection is active', async () => {
    useDashboardState.setState({
      ...parseDashboardQuery(),
      donorCountry: 'United States',
      selectionType: 'donorCountry',
      selectionId: 'United States',
      idleMode: false,
    })

    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [
              {
                donorId: 'gates-foundation',
                donorName: 'Gates Foundation',
                donorCountry: 'United States',
                donorLat: 37.09,
                donorLon: -95.71,
                recipientIso3: 'UKR',
                recipientName: 'Ukraine',
                recipientLat: 49,
                recipientLon: 32,
                amountUsdM: 663.1,
                years: [2023],
                yearAmounts: [{ year: 2023, totalUsdM: 663.1 }],
                sector: 'Health',
              },
            ],
            points: [
              {
                iso3: 'UKR',
                name: 'Ukraine',
                lat: 49,
                lon: 32,
                totalUsdM: 663.1,
                donorCount: 35,
              },
            ],
            visibleFundingUsdM: 663.1,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                properties: {
                  iso_a3: 'UKR',
                  name: 'Ukraine',
                },
              },
              {
                properties: {
                  iso_a3: 'FRA',
                  name: 'France',
                },
              },
            ],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(['United States', 'France']),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="polygon-stroke-0"]')?.textContent).toBe('rgba(251,191,36,0.58)')
    expect(container.querySelector('[data-testid="polygon-stroke-1"]')?.textContent).toBe('rgba(255,255,255,0.08)')
  })

  it('switches non-recipient donor-country clicks to donor-country selection while donor-country mode is active', async () => {
    useDashboardState.setState({
      ...parseDashboardQuery(),
      donorCountry: 'United States',
      selectionType: 'donorCountry',
      selectionId: 'United States',
      idleMode: false,
    })

    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [
              {
                donorId: 'gates-foundation',
                donorName: 'Gates Foundation',
                donorCountry: 'United States',
                donorLat: 37.09,
                donorLon: -95.71,
                recipientIso3: 'UKR',
                recipientName: 'Ukraine',
                recipientLat: 49,
                recipientLon: 32,
                amountUsdM: 663.1,
                years: [2023],
                yearAmounts: [{ year: 2023, totalUsdM: 663.1 }],
                sector: 'Health',
              },
            ],
            points: [
              {
                iso3: 'UKR',
                name: 'Ukraine',
                lat: 49,
                lon: 32,
                totalUsdM: 663.1,
                donorCount: 35,
              },
            ],
            visibleFundingUsdM: 663.1,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                properties: {
                  iso_a3: 'UKR',
                  name: 'Ukraine',
                },
              },
              {
                properties: {
                  iso_a3: 'FRA',
                  name: 'France',
                },
              },
            ],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(['United States', 'France']),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    const trigger = container.querySelector('[data-testid="globe-click-country-polygon-stub-2"]')

    expect(trigger).not.toBeNull()

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const state = useDashboardState.getState()

    expect(state.selectionType).toBe('donorCountry')
    expect(state.selectionId).toBe('France')
    expect(state.donorCountry).toBe('France')
    expect(state.selectedCountryIso3).toBeNull()
  })

  it('keeps donor-country recipient outlines visible after selecting one recipient country', async () => {
    useDashboardState.setState({
      ...parseDashboardQuery(),
      donorCountry: 'United States',
      selectionType: 'country',
      selectionId: 'UKR',
      recipientCountry: 'Ukraine',
      selectedCountryIso3: 'UKR',
      idleMode: false,
    })

    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.includes('/api/globe?') && url.includes('recipientCountry=Ukraine')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [
              {
                donorId: 'gates-foundation',
                donorName: 'Gates Foundation',
                donorCountry: 'United States',
                donorLat: 37.09,
                donorLon: -95.71,
                recipientIso3: 'UKR',
                recipientName: 'Ukraine',
                recipientLat: 49,
                recipientLon: 32,
                amountUsdM: 663.1,
                years: [2023],
                yearAmounts: [{ year: 2023, totalUsdM: 663.1 }],
                sector: 'Health',
              },
            ],
            points: [
              {
                iso3: 'UKR',
                name: 'Ukraine',
                lat: 49,
                lon: 32,
                totalUsdM: 663.1,
                donorCount: 35,
              },
            ],
            visibleFundingUsdM: 791.5,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url.includes('/api/globe?') && url.includes('donorCountry=United+States') && !url.includes('recipientCountry=')) {
        return {
          ok: true,
          json: async () => ({
            arcs: [
              {
                donorId: 'gates-foundation',
                donorName: 'Gates Foundation',
                donorCountry: 'United States',
                donorLat: 37.09,
                donorLon: -95.71,
                recipientIso3: 'UKR',
                recipientName: 'Ukraine',
                recipientLat: 49,
                recipientLon: 32,
                amountUsdM: 663.1,
                years: [2023],
                yearAmounts: [{ year: 2023, totalUsdM: 663.1 }],
                sector: 'Health',
              },
              {
                donorId: 'gates-foundation',
                donorName: 'Gates Foundation',
                donorCountry: 'United States',
                donorLat: 37.09,
                donorLon: -95.71,
                recipientIso3: 'KEN',
                recipientName: 'Kenya',
                recipientLat: -0.02,
                recipientLon: 37.91,
                amountUsdM: 128.4,
                years: [2023],
                yearAmounts: [{ year: 2023, totalUsdM: 128.4 }],
                sector: 'Health',
              },
            ],
            points: [],
            visibleFundingUsdM: 791.5,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                properties: {
                  iso_a3: 'UKR',
                  name: 'Ukraine',
                },
              },
              {
                properties: {
                  iso_a3: 'KEN',
                  name: 'Kenya',
                },
              },
              {
                properties: {
                  iso_a3: 'FRA',
                  name: 'France',
                },
              },
            ],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(['United States', 'France']),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="polygon-stroke-0"]')?.textContent).toBe('rgba(251,191,36,0.58)')
    expect(container.querySelector('[data-testid="polygon-stroke-1"]')?.textContent).toBe('rgba(251,191,36,0.58)')
    expect(container.querySelector('[data-testid="polygon-stroke-2"]')?.textContent).toBe('rgba(255,255,255,0.08)')
    expect(container.querySelector('[data-testid="arc-count"]')?.textContent).toBe('1')
  })

  it('caps rendered arcs at 300 even for selected donor states', async () => {
    useDashboardState.setState({
      ...parseDashboardQuery(),
      selectionType: 'donor',
      selectionId: 'gates-foundation',
      selectedDonorId: 'gates-foundation',
      idleMode: false,
    })

    const manyArcs = Array.from({ length: 350 }, (_, index) => ({
      donorId: 'gates-foundation',
      donorName: 'Gates Foundation',
      donorCountry: 'United States',
      donorLat: 37.09,
      donorLon: -95.71,
      recipientIso3: `C${index}`,
      recipientName: `Country ${index}`,
      recipientLat: index,
      recipientLon: index,
      amountUsdM: index + 1,
      years: [2023],
      yearAmounts: [{ year: 2023, totalUsdM: index + 1 }],
      sector: 'Health',
    }))

    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.startsWith('/api/globe')) {
        return {
          ok: true,
          json: async () => ({
            arcs: manyArcs,
            points: [],
            visibleFundingUsdM: 1000,
            crossBorderPct: 100,
            domesticPct: 0,
          }),
        }
      }

      if (url === '/data/countries.geojson') {
        return {
          ok: true,
          json: async () => ({
            features: [],
          }),
        }
      }

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => createFiltersResponse(['United States']),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="arc-count"]')?.textContent).toBe('300')
  })
})

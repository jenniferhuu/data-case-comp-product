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
    arcsData?: Array<{
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
          onClick={() => props.onPointClick?.({
            iso3: 'UKR',
            name: 'Ukraine',
            totalUsdM: 663.1,
            donorCount: 35,
          })}
        >
          globe stub
        </button>
        <div data-testid="compare-color">{compareColor}</div>
      </div>
    )
  },
}))

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

      throw new Error(`Unexpected fetch: ${url}`)
    }))

    await act(async () => {
      root.render(<GlobeScene />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Globe data is unavailable.')
    expect(container.textContent).toContain('Visible funding')
    expect(container.textContent).toContain('$0M')
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
          }),
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
          }),
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
})

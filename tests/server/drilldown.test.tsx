// @vitest-environment jsdom
import React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardShell } from '../../src/components/dashboard/DashboardShell'
import { HeroStats } from '../../src/components/dashboard/HeroStats'
import { InsightRail } from '../../src/components/dashboard/InsightRail'
import { CountryDrilldown } from '../../src/components/panels/CountryDrilldown'
import { DonorDrilldown } from '../../src/components/panels/DonorDrilldown'
import { parseDashboardQuery } from '../../src/features/dashboard/queryState'
import { useDashboardState } from '../../src/features/dashboard/useDashboardState'
import type { DrilldownResponse } from '../../src/contracts/drilldown'
import type { OverviewResponse } from '../../src/contracts/overview'

vi.mock('../../src/components/Globe/GlobeScene', () => ({
  GlobeScene: () => <div>globe-canvas</div>,
}))

vi.mock('../../src/components/Globe/GlobeIdleController', () => ({
  GlobeIdleController: () => null,
}))

const overview: OverviewResponse = {
  totals: {
    fundingUsdM: 68237.1,
    donors: 506,
    countries: 163,
    corridors: 3138,
  },
  highlights: [
    {
      id: 'largest-donor',
      label: 'Largest donor',
      value: 'Gates Foundation',
      tone: 'positive',
    },
  ],
}

const donorSelection: DrilldownResponse = {
  donor: {
    id: 'gates-foundation',
    name: 'Gates Foundation',
    country: 'United States',
    totalUsdM: 18890.4,
  },
  country: null,
}

const countrySelection: DrilldownResponse = {
  donor: null,
  country: {
    iso3: 'UKR',
    name: 'Ukraine',
    totalUsdM: 663.1,
  },
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve }
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('dashboard drilldown surfaces', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    useDashboardState.setState(parseDashboardQuery())
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  it('renders donor summary content on the server', () => {
    const html = renderToString(<DonorDrilldown donor={donorSelection.donor!} />)

    expect(html).toContain('Gates Foundation')
    expect(html).toContain('United States')
    expect(html).toContain('$18,890.4M')
  })

  it('renders country summary content on the server', () => {
    const html = renderToString(<CountryDrilldown country={countrySelection.country!} />)

    expect(html).toContain('Ukraine')
    expect(html).toContain('UKR')
    expect(html).toContain('$663.1M')
  })

  it('renders overview metrics in the hero surface on the server', () => {
    const html = renderToString(<HeroStats overview={overview} />)

    expect(html).toContain('68,237.1M')
    expect(html).toContain('506')
    expect(html).toContain('3,138')
    expect(html).toContain('Largest donor')
    expect(html).toContain('Gates Foundation')
  })

  it('renders donor drilldown content in the insight rail on the server', () => {
    useDashboardState.getState().selectDonor('gates-foundation')

    const html = renderToString(<InsightRail overview={overview} drilldown={donorSelection} />)

    expect(html).toContain('Donor focus')
    expect(html).toContain('Gates Foundation')
    expect(html).toContain('United States')
    expect(html).toContain('Selection-driven analysis')
  })

  it('renders country drilldown content in the insight rail on the server', () => {
    useDashboardState.getState().selectCountry('UKR')

    const html = renderToString(<InsightRail overview={overview} drilldown={countrySelection} />)

    expect(html).toContain('Country focus')
    expect(html).toContain('Ukraine')
    expect(html).toContain('UKR')
    expect(html).toContain('Tracked recipient footprint')
  })

  it('fetches overview once in the shell and shares it across task 10 surfaces', async () => {
    const fetchMock = vi
      .fn<(input: string | URL | Request) => Promise<{ ok: boolean, json: () => Promise<unknown> }>>()
      .mockImplementation((input) => {
        const url = String(input)

        if (url === '/api/overview') {
          return Promise.resolve({
            ok: true,
            json: async () => overview,
          })
        }

        if (url.startsWith('/api/drilldown')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ donor: null, country: null }),
          })
        }

        throw new Error(`Unexpected fetch: ${url}`)
      })

    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root.render(<DashboardShell />)
    })
    await flushEffects()

    expect(fetchMock.mock.calls.filter(([input]) => String(input) === '/api/overview')).toHaveLength(1)
    expect(container.textContent).toContain('Funding tracked')
    expect(container.textContent).toContain('Largest donor: Gates Foundation')
  })

  it('clears stale drilldown content during selection changes and reset', async () => {
    const countryRequest = createDeferred<DrilldownResponse>()
    const resetRequest = createDeferred<DrilldownResponse>()
    let defaultDrilldownRequests = 0
    const fetchMock = vi
      .fn<(input: string | URL | Request) => Promise<{ ok: boolean, json: () => Promise<unknown> }>>()
      .mockImplementation((input) => {
        const url = String(input)

        if (url === '/api/drilldown?selectionType=country&selectionId=UKR') {
          return Promise.resolve({
            ok: true,
            json: async () => countryRequest.promise,
          })
        }

        if (url === '/api/drilldown') {
          defaultDrilldownRequests += 1
          return Promise.resolve({
            ok: true,
            json: async () => (defaultDrilldownRequests === 1 ? resetRequest.promise : { donor: null, country: null }),
          })
        }

        throw new Error(`Unexpected fetch: ${url}`)
      })

    vi.stubGlobal('fetch', fetchMock)

    useDashboardState.getState().selectDonor('gates-foundation')
    await act(async () => {
      root.render(<InsightRail overview={overview} drilldown={donorSelection} />)
    })
    expect(container.textContent).toContain('Donor focus')

    await act(async () => {
      useDashboardState.getState().selectCountry('UKR')
      root.render(<InsightRail overview={overview} />)
    })
    await flushEffects()

    expect(fetchMock).toHaveBeenCalledWith('/api/drilldown?selectionType=country&selectionId=UKR')
    expect(container.textContent).not.toContain('Donor focus')
    expect(container.textContent).not.toContain('Donor concentration snapshot')
    expect(container.textContent).toContain('Overview state')

    countryRequest.resolve(countrySelection)
    await flushEffects()

    expect(container.textContent).toContain('Ukraine')

    await act(async () => {
      useDashboardState.getState().resetSelection()
      root.render(<InsightRail overview={overview} />)
    })
    await flushEffects()

    expect(container.textContent).not.toContain('Country focus')
    expect(container.textContent).not.toContain('Ukraine')
    expect(container.textContent).toContain('Overview state')

    resetRequest.resolve({ donor: null, country: null })
    await flushEffects()
  })
})

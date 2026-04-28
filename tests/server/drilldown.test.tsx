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
  topSectors: [
    { label: 'Health', totalUsdM: 27101.589 },
    { label: 'Economic Dev', totalUsdM: 10446.1365 },
  ],
  topRecipients: [
    { label: 'China', totalUsdM: 8846.9111 },
    { label: 'Ukraine', totalUsdM: 663.0589 },
  ],
  topDonors: [
    { id: 'gates-foundation', label: 'Gates Foundation', totalUsdM: 18890.4033, country: 'United States' },
    { id: 'bbvamf', label: 'BBVAMF', totalUsdM: 5038.4418, country: 'Spain' },
  ],
  yearlyFunding: [
    { year: 2020, totalUsdM: 17170.5555 },
    { year: 2021, totalUsdM: 17381.5559 },
    { year: 2022, totalUsdM: 16679.5496 },
    { year: 2023, totalUsdM: 16919.8854 },
  ],
  modalityBreakdown: [
    { label: 'Grants', totalUsdM: 64000 },
    { label: 'Loans', totalUsdM: 4237.1 },
  ],
  commitmentProgress: {
    disbursedPct: 62.1,
  },
}

const donorSelection: DrilldownResponse = {
  donor: {
    id: 'gates-foundation',
    name: 'Gates Foundation',
    country: 'United States',
    totalUsdM: 18890.4,
    recipientCount: 99,
    topRecipientShare: 6,
    yearlyFunding: [
      { year: 2020, totalUsdM: 4721.6974 },
      { year: 2021, totalUsdM: 4784.3378 },
      { year: 2022, totalUsdM: 4547.8622 },
      { year: 2023, totalUsdM: 4836.506 },
    ],
    sectorBreakdown: [
      { sector: 'Health', totalUsdM: 14858.6862 },
      { sector: 'Economic Dev', totalUsdM: 2339.9873 },
    ],
    topRecipients: [
      { iso3: 'IND', name: 'India', totalUsdM: 1133.5824 },
      { iso3: 'NGA', name: 'Nigeria', totalUsdM: 797.4976 },
    ],
    topImplementers: [
      { name: 'UNICEF', totalUsdM: 1100.5 },
      { name: 'PATH', totalUsdM: 998.1 },
    ],
    modalityBreakdown: [
      { label: 'Grants', totalUsdM: 17000.1 },
      { label: 'Loans', totalUsdM: 1890.3 },
    ],
    flowGeography: {
      crossBorderPct: 92.4,
      domesticPct: 7.6,
    },
  },
  country: null,
  donorCountry: null,
}

const countrySelection: DrilldownResponse = {
  donor: null,
  country: {
    iso3: 'UKR',
    name: 'Ukraine',
    totalUsdM: 663.1,
    donorCount: 35,
    topDonorShare: 76.1,
    yearlyFunding: [
      { year: 2020, totalUsdM: 2.1247 },
      { year: 2021, totalUsdM: 6.7884 },
      { year: 2022, totalUsdM: 274.978 },
      { year: 2023, totalUsdM: 379.1678 },
    ],
    sectorBreakdown: [
      { sector: 'Other', totalUsdM: 177.9358 },
      { sector: 'Economic Dev', totalUsdM: 156.1165 },
    ],
    topDonors: [
      { id: 'howard-g-buffett-foundation', name: 'Howard G. Buffett Foundation', country: 'United States', totalUsdM: 504.8489 },
      { id: 'ikea-foundation', name: 'IKEA Foundation', country: 'Netherlands', totalUsdM: 29.0193 },
    ],
    topImplementers: [
      { name: 'UNICEF', totalUsdM: 301.7 },
      { name: 'ICRC', totalUsdM: 188.4 },
    ],
  },
  donorCountry: null,
}

const donorCountrySelection: DrilldownResponse = {
  donor: null,
  country: null,
  donorCountry: {
    name: 'United States',
    totalUsdM: 22100.8,
    donorCount: 124,
    topDonors: [
      { id: 'gates-foundation', name: 'Gates Foundation', country: 'United States', totalUsdM: 9000.4 },
      { id: 'howard-g-buffett-foundation', name: 'Howard G. Buffett Foundation', country: 'United States', totalUsdM: 2800.1 },
    ],
    sectorBreakdown: [
      { sector: 'Health', totalUsdM: 11000.2 },
      { sector: 'Agriculture', totalUsdM: 4600.5 },
    ],
    yearlyFunding: [
      { year: 2021, totalUsdM: 6100.2 },
      { year: 2022, totalUsdM: 7200.3 },
      { year: 2023, totalUsdM: 8800.3 },
    ],
    topRecipients: [
      { iso3: 'UKR', name: 'Ukraine', totalUsdM: 5000.2 },
      { iso3: 'KEN', name: 'Kenya', totalUsdM: 3200.1 },
    ],
    topImplementers: [
      { name: 'UNICEF', totalUsdM: 4200.4 },
      { name: 'CARE', totalUsdM: 1800.2 },
    ],
    modalityBreakdown: [
      { label: 'Grants', totalUsdM: 21000.6 },
      { label: 'Loans', totalUsdM: 1100.2 },
    ],
    flowGeography: {
      crossBorderPct: 96.1,
      domesticPct: 3.9,
    },
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
    useDashboardState.getState().hydrateFromQuery(parseDashboardQuery())
    useDashboardState.setState({ globeStats: null })
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
    expect(html).toContain('$18,890.4M')
    expect(html).toContain('99')
    expect(html).toContain('Flow geography')
    expect(html).toContain('Grants vs loans')
    expect(html).toContain('Health')
    expect(html).toContain('India')
  })

  it('renders country summary content on the server', () => {
    const html = renderToString(<CountryDrilldown country={countrySelection.country!} />)

    expect(html).toContain('Ukraine')
    expect(html).toContain('UKR')
    expect(html).toContain('$663.1M')
    expect(html).toContain('35')
    expect(html).toContain('Howard G. Buffett Foundation')
    expect(html).toContain('Other')
  })

  it('renders overview metrics in the hero surface on the server', () => {
    const html = renderToString(<HeroStats overview={overview} />)

    expect(html).toContain('Visible funding')
    expect(html).toContain('Live corridors')
    expect(html).toContain('Recipient countries')
    expect(html).toContain('Largest donor')
    expect(html).toContain('Gates Foundation')
  })

  it('shows commitment disbursement progress when commitments mode is active', async () => {
    useDashboardState.getState().hydrateFromQuery(parseDashboardQuery())
    useDashboardState.getState().patchQuery({ valueMode: 'commitments' })

    await act(async () => {
      root.render(<HeroStats overview={overview} />)
    })

    expect(container.textContent).toContain('Commitments disbursed')
    expect(container.textContent).toContain('62.1%')
  })

  it('renders donor drilldown content in the insight rail on the server', () => {
    useDashboardState.getState().selectDonor('gates-foundation')

    const html = renderToString(<InsightRail overview={overview} drilldown={donorSelection} />)

    expect(html).toContain('Donor')
    expect(html).toContain('Gates Foundation')
    expect(html).toContain('Selection-driven analysis')
    expect(html).toContain('Flow geography')
    expect(html).toContain('Grants vs loans')
    expect(html).toContain('Top recipients')
  })

  it('renders donor-country drilldown content in the insight rail on the server', () => {
    useDashboardState.getState().selectDonorCountry('United States')

    const html = renderToString(<InsightRail overview={overview} drilldown={donorCountrySelection} />)

    expect(html).toContain('Donor country')
    expect(html).toContain('United States')
    expect(html).toContain('Flow geography')
    expect(html).toContain('Grants vs loans')
    expect(html).toContain('Top donors')
  })

  it('renders country drilldown content in the insight rail on the server', () => {
    useDashboardState.getState().selectCountry('UKR')

    const html = renderToString(<InsightRail overview={overview} drilldown={countrySelection} />)

    expect(html).toContain('Country focus')
    expect(html).toContain('Ukraine')
    expect(html).toContain('UKR')
    expect(html).toContain('Top donors')
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

        if (url === '/api/overview?yearMode=all&valueMode=disbursements') {
          return Promise.resolve({
            ok: true,
            json: async () => overview,
          })
        }

        if (url === '/api/filters') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              donorCountries: ['United States', 'United Kingdom'],
              sectors: ['720', '930'],
              years: [2020, 2021, 2022, 2023],
              markers: [],
            }),
          })
        }

        if (url.startsWith('/api/drilldown')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ donor: null, country: null, donorCountry: null }),
          })
        }

        throw new Error(`Unexpected fetch: ${url}`)
      })

    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root.render(<DashboardShell />)
    })
    await flushEffects()

    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input) === '/api/overview' || String(input) === '/api/overview?yearMode=all&valueMode=disbursements',
      ),
    ).toHaveLength(1)
    expect(container.textContent).toContain('Visible funding')
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

        if (url === '/api/drilldown?yearMode=all&valueMode=disbursements&selectionType=country&selectionId=UKR') {
          return Promise.resolve({
            ok: true,
            json: async () => countryRequest.promise,
          })
        }

        if (url === '/api/drilldown?yearMode=all&valueMode=disbursements') {
          defaultDrilldownRequests += 1
          return Promise.resolve({
            ok: true,
            json: async () => (defaultDrilldownRequests === 1 ? resetRequest.promise : { donor: null, country: null, donorCountry: null }),
          })
        }

        throw new Error(`Unexpected fetch: ${url}`)
      })

    vi.stubGlobal('fetch', fetchMock)

    useDashboardState.getState().selectDonor('gates-foundation')
    await act(async () => {
      root.render(<InsightRail overview={overview} drilldown={donorSelection} />)
    })
    expect(container.textContent).toContain('Gates Foundation')

    await act(async () => {
      useDashboardState.getState().selectCountry('UKR')
      root.render(<InsightRail overview={overview} />)
    })
    await flushEffects()

    expect(fetchMock).toHaveBeenCalledWith('/api/drilldown?yearMode=all&valueMode=disbursements&selectionType=country&selectionId=UKR')
    expect(container.textContent).not.toContain('Donor focus')
    expect(container.textContent).not.toContain('Recipient base')
    expect(container.textContent).toContain('Platform overview')

    countryRequest.resolve(countrySelection)
    await flushEffects()

    expect(container.textContent).toContain('Ukraine')

    await act(async () => {
      useDashboardState.getState().resetSelection()
      root.render(<InsightRail overview={overview} />)
    })
    await flushEffects()

    expect(container.textContent).not.toContain('Country focus')
    expect(container.textContent).not.toContain('41.4% held by top donor')
    expect(container.textContent).toContain('Platform overview')

    resetRequest.resolve({ donor: null, country: null, donorCountry: null })
    await flushEffects()
  })
})

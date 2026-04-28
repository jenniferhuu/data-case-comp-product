// @vitest-environment jsdom
import React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardShell } from '../../src/components/dashboard/DashboardShell'
import { parseDashboardQuery } from '../../src/features/dashboard/queryState'
import { useDashboardState } from '../../src/features/dashboard/useDashboardState'

vi.mock('../../src/components/Globe/GlobeScene', () => ({
  GlobeScene: () => <div>globe-canvas</div>,
}))

vi.mock('../../src/components/Globe/GlobeIdleController', () => ({
  GlobeIdleController: () => null,
}))

describe('Dashboard onboarding overlay', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    useDashboardState.getState().hydrateFromQuery(parseDashboardQuery())
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url === '/api/filters') {
        return {
          ok: true,
          json: async () => ({
            donors: ['Gates Foundation'],
            donorCountries: ['United States'],
            recipientCountries: ['Ukraine'],
            sectors: ['Health'],
            years: [2020, 2021, 2022, 2023],
            markers: [],
            donorIdMap: { 'Gates Foundation': 'gates-foundation' },
            recipientCountryIsoMap: { Ukraine: 'UKR' },
          }),
        }
      }

      if (url === '/api/overview' || url === '/api/overview?yearMode=all&valueMode=disbursements') {
        return {
          ok: true,
          json: async () => ({
            totals: { fundingUsdM: 1, donors: 1, countries: 1, corridors: 1 },
            highlights: [],
            topSectors: [],
            topRecipients: [],
            topDonors: [],
            yearlyFunding: [],
            modalityBreakdown: [],
          }),
        }
      }

      if (url === '/api/drilldown' || url === '/api/drilldown?yearMode=all&valueMode=disbursements') {
        return {
          ok: true,
          json: async () => ({ donor: null, country: null, donorCountry: null }),
        }
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }))
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  it('shows on load and reappears after a page reload', async () => {
    await act(async () => {
      root.render(<DashboardShell />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('How to read the dashboard')
    expect(container.textContent).toContain('Left rail')
    expect(container.textContent).toContain('Center globe')
    expect(container.textContent).toContain('Right rail')

    const dismissButton = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Start exploring')
    expect(dismissButton).toBeDefined()

    await act(async () => {
      dismissButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(container.textContent).not.toContain('How to read the dashboard')

    await act(async () => {
      root.unmount()
    })

    root = createRoot(container)

    await act(async () => {
      root.render(<DashboardShell />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('How to read the dashboard')
  })
})

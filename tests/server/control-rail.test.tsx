// @vitest-environment jsdom
import React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ControlRail } from '../../src/components/dashboard/ControlRail'
import { parseDashboardQuery } from '../../src/features/dashboard/queryState'
import { useDashboardState } from '../../src/features/dashboard/useDashboardState'

describe('ControlRail', () => {
  let container: HTMLDivElement
  let root: Root

  function typeIntoInput(input: HTMLInputElement, nextValue: string) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
    descriptor?.set?.call(input, nextValue)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

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

  it('does not enter an invalid year mode before filters finish loading', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    await act(async () => {
      root.render(<ControlRail />)
    })

    const singleButton = [...container.querySelectorAll('button')].find((button) => button.textContent === 'single')

    expect(singleButton).toBeDefined()

    await act(async () => {
      singleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const state = useDashboardState.getState()

    expect(state.yearMode).toBe('all')
    expect(state.year).toBeUndefined()
    expect(state.compareFrom).toBeUndefined()
    expect(state.compareTo).toBeUndefined()
  })

  it('shows an unavailable message when filters fail to load', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      json: async () => ({
        message: 'Filter data is unavailable.',
      }),
    })))

    await act(async () => {
      root.render(<ControlRail />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Filter data is unavailable.')
    expect(container.textContent).not.toContain('Loading dashboard filters...')
  })

  it('defaults to disbursements and lets commitments be selected', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
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
    })))

    await act(async () => {
      root.render(<ControlRail />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(useDashboardState.getState().valueMode).toBe('disbursements')

    const commitmentsButton = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Commitments')
    expect(commitmentsButton).toBeDefined()

    await act(async () => {
      commitmentsButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(useDashboardState.getState().valueMode).toBe('commitments')
  })

  it('explains compare mode as delta analysis instead of generic year layering', async () => {
    useDashboardState.setState({
      ...parseDashboardQuery(),
      yearMode: 'compare',
      compareFrom: 2020,
      compareTo: 2023,
    })

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        donorCountries: ['United States'],
        sectors: ['Health'],
        years: [2020, 2021, 2022, 2023],
        markers: [],
      }),
    })))

    await act(async () => {
      root.render(<ControlRail />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Compare mode highlights funding deltas')
    expect(container.textContent).toContain('line weight continues to show visible funding volume')
  })

  it('filters donor, donor-country, recipient-country, and sector options with inline search', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        donors: ['Gates Foundation', 'Ford Foundation'],
        donorCountries: ['United States', 'United Kingdom'],
        recipientCountries: ['Ukraine', 'Uganda'],
        sectors: ['Health', 'Agriculture'],
        years: [2020, 2021, 2022, 2023],
        markers: [],
        donorIdMap: {
          'Gates Foundation': 'gates-foundation',
          'Ford Foundation': 'ford-foundation',
        },
        recipientCountryIsoMap: {
          Ukraine: 'UKR',
          Uganda: 'UGA',
        },
      }),
    })))

    await act(async () => {
      root.render(<ControlRail />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    const trigger = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('All donors'))
    expect(trigger).toBeDefined()

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const donorSearch = container.querySelector('input[aria-label="Search donor"]') as HTMLInputElement | null
    expect(donorSearch).not.toBeNull()

    await act(async () => {
      typeIntoInput(donorSearch!, 'ford')
    })

    expect(container.textContent).toContain('Ford Foundation')
    expect(container.textContent).not.toContain('Gates Foundation')

    const donorCountryTrigger = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('All donor countries'))
    expect(donorCountryTrigger).toBeDefined()

    await act(async () => {
      donorCountryTrigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const donorCountrySearch = container.querySelector('input[aria-label="Search donor country"]') as HTMLInputElement | null
    expect(donorCountrySearch).not.toBeNull()

    await act(async () => {
      typeIntoInput(donorCountrySearch!, 'king')
    })

    expect(container.textContent).toContain('United Kingdom')
    expect(container.textContent).not.toContain('United States')

    const recipientTrigger = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('All recipient countries'))
    expect(recipientTrigger).toBeDefined()

    await act(async () => {
      recipientTrigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const recipientSearch = container.querySelector('input[aria-label="Search recipient country"]') as HTMLInputElement | null
    expect(recipientSearch).not.toBeNull()

    await act(async () => {
      typeIntoInput(recipientSearch!, 'ugan')
    })

    expect(container.textContent).toContain('Uganda')
    expect(container.textContent).not.toContain('Ukraine')

    const sectorTrigger = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('All sectors'))
    expect(sectorTrigger).toBeDefined()

    await act(async () => {
      sectorTrigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const sectorSearch = container.querySelector('input[aria-label="Search sector"]') as HTMLInputElement | null
    expect(sectorSearch).not.toBeNull()

    await act(async () => {
      typeIntoInput(sectorSearch!, 'agri')
    })

    expect(container.textContent).toContain('Agriculture')
    expect(container.textContent).not.toContain('Health')
  })
})

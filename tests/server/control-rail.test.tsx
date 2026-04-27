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
})

import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { DashboardShell } from '../../src/components/dashboard/DashboardShell'
import { createDashboardSearchParams, parseDashboardQuery } from '../../src/features/dashboard/queryState'
import { useDashboardState } from '../../src/features/dashboard/useDashboardState'

describe('DashboardShell', () => {
  it('renders the dashboard frame with rails and globe stage', () => {
    const html = renderToString(<DashboardShell />)

    expect(html).toContain('data-testid="dashboard-shell"')
    expect(html).toContain('Filter the global flow map')
    expect(html).toContain('Selection-driven analysis')
    expect(html).toContain('id="globe-stage"')
    expect(html).toContain('Global funding command center')
  })

  it('clears selection back to an idle state when selectCountry or selectDonor receive null', () => {
    useDashboardState.setState(parseDashboardQuery())

    useDashboardState.getState().selectCountry('UKR')
    useDashboardState.getState().selectCountry(null)
    expect(useDashboardState.getState()).toMatchObject({
      idleMode: true,
      selectionType: undefined,
      selectionId: undefined,
      selectedCountryIso3: null,
      selectedDonorId: null,
    })

    useDashboardState.getState().selectDonor('acme-foundation')
    useDashboardState.getState().selectDonor(null)
    expect(useDashboardState.getState()).toMatchObject({
      idleMode: true,
      selectionType: undefined,
      selectionId: undefined,
      selectedCountryIso3: null,
      selectedDonorId: null,
    })
  })

  it('applies partial query patches without requiring a full query payload', () => {
    useDashboardState.getState().hydrateFromQuery(parseDashboardQuery())

    useDashboardState.getState().patchQuery({
      yearMode: 'single',
      year: 2022,
    })
    expect(useDashboardState.getState()).toMatchObject({
      yearMode: 'single',
      year: 2022,
      idleMode: true,
    })

    useDashboardState.getState().patchQuery({
      selectionType: 'country',
      selectionId: 'KEN',
    })
    expect(useDashboardState.getState()).toMatchObject({
      selectionType: 'country',
      selectionId: 'KEN',
      selectedCountryIso3: 'KEN',
      selectedDonorId: null,
      idleMode: false,
    })

    useDashboardState.getState().patchQuery({
      selectionType: undefined,
      selectionId: undefined,
    })
    expect(useDashboardState.getState()).toMatchObject({
      selectionType: undefined,
      selectionId: undefined,
      selectedCountryIso3: null,
      selectedDonorId: null,
      idleMode: true,
    })
  })

  it('clears omitted optional query fields during hydration', () => {
    useDashboardState.getState().patchQuery({
      yearMode: 'single',
      year: 2022,
      selectionType: 'country',
      selectionId: 'KEN',
    })

    useDashboardState.getState().hydrateFromQuery(
      parseDashboardQuery({
        yearMode: 'all',
      }),
    )

    expect(useDashboardState.getState()).toMatchObject({
      yearMode: 'all',
      year: undefined,
      selectionType: undefined,
      selectionId: undefined,
      selectedCountryIso3: null,
      selectedDonorId: null,
      idleMode: true,
    })
  })

  it('serializes only real query values', () => {
    const searchParams = createDashboardSearchParams(
      parseDashboardQuery({
        yearMode: 'single',
        year: '2024',
        valueMode: 'commitments',
      }),
    )

    expect(searchParams.toString()).toBe('yearMode=single&year=2024&valueMode=commitments')
    expect(renderToString(<DashboardShell />)).not.toContain('Current query')
  })

  it('accepts hydrated typed query input without materializing absent optional fields', () => {
    const parsed = parseDashboardQuery({
      yearMode: 'single',
      year: 2024,
    })

    expect(parsed).toMatchObject({
      yearMode: 'single',
      year: 2024,
      valueMode: 'disbursements',
    })
    expect(parsed).not.toHaveProperty('selectionType')
    expect(parsed).not.toHaveProperty('selectionId')
  })
})

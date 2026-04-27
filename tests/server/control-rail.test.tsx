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
})

import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { GlobeScene } from '../../src/components/Globe/GlobeScene'
import { DashboardShell } from '../../src/components/dashboard/DashboardShell'

describe('GlobeScene', () => {
  it('renders a server-side fallback inside the globe mount container', () => {
    const html = renderToString(<GlobeScene />)

    expect(html).toContain('globe-canvas')
    expect(html).toContain('Globe loading')
    expect(html).toContain('Preparing the interactive funding map')
  })

  it('mounts the globe fallback into the dashboard stage before hydration', () => {
    const html = renderToString(<DashboardShell />)

    expect(html).toContain('id="globe-stage"')
    expect(html).toContain('Globe loading')
    expect(html).toContain('Preparing the interactive funding map')
  })
})

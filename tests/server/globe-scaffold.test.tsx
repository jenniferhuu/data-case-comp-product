import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { GlobeScene } from '../../src/components/Globe/GlobeScene'

describe('GlobeScene', () => {
  it('renders a globe mount container', () => {
    const html = renderToString(<GlobeScene />)

    expect(html).toContain('globe-canvas')
  })
})

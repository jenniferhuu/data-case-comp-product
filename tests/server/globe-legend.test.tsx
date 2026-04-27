import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { GlobeLegend } from '../../src/components/Globe/GlobeLegend'

describe('GlobeLegend', () => {
  it('renders sector and volume guidance in standard mode', () => {
    const html = renderToString(<GlobeLegend compareMode={false} />)

    expect(html).toContain('Sector')
    expect(html).toContain('Volume')
    expect(html).toContain('Health')
  })

  it('renders delta guidance in compare mode', () => {
    const html = renderToString(<GlobeLegend compareMode />)

    expect(html).toContain('positive delta')
    expect(html).toContain('negative delta')
    expect(html).toContain('neutral midpoint')
  })
})

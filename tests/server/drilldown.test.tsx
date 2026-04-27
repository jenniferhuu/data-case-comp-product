import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { HeroStats } from '../../src/components/dashboard/HeroStats'
import { InsightRail } from '../../src/components/dashboard/InsightRail'
import { CountryDrilldown } from '../../src/components/panels/CountryDrilldown'
import { DonorDrilldown } from '../../src/components/panels/DonorDrilldown'
import { parseDashboardQuery } from '../../src/features/dashboard/queryState'
import { useDashboardState } from '../../src/features/dashboard/useDashboardState'
import type { DrilldownResponse } from '../../src/contracts/drilldown'
import type { OverviewResponse } from '../../src/contracts/overview'

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

describe('dashboard drilldown surfaces', () => {
  beforeEach(() => {
    useDashboardState.setState(parseDashboardQuery())
  })

  it('renders donor summary content', () => {
    const html = renderToString(<DonorDrilldown donor={donorSelection.donor!} />)

    expect(html).toContain('Gates Foundation')
    expect(html).toContain('United States')
    expect(html).toContain('$18,890.4M')
  })

  it('renders country summary content', () => {
    const html = renderToString(<CountryDrilldown country={countrySelection.country!} />)

    expect(html).toContain('Ukraine')
    expect(html).toContain('UKR')
    expect(html).toContain('$663.1M')
  })

  it('renders overview metrics in the hero surface', () => {
    const html = renderToString(<HeroStats overview={overview} />)

    expect(html).toContain('68,237.1M')
    expect(html).toContain('506')
    expect(html).toContain('3,138')
    expect(html).toContain('Largest donor')
    expect(html).toContain('Gates Foundation')
  })

  it('renders donor drilldown content in the insight rail', () => {
    useDashboardState.getState().selectDonor('gates-foundation')

    const html = renderToString(<InsightRail overview={overview} drilldown={donorSelection} />)

    expect(html).toContain('Donor focus')
    expect(html).toContain('Gates Foundation')
    expect(html).toContain('United States')
    expect(html).toContain('Selection-driven analysis')
  })

  it('renders country drilldown content in the insight rail', () => {
    useDashboardState.getState().selectCountry('UKR')

    const html = renderToString(<InsightRail overview={overview} drilldown={countrySelection} />)

    expect(html).toContain('Country focus')
    expect(html).toContain('Ukraine')
    expect(html).toContain('UKR')
    expect(html).toContain('Tracked recipient footprint')
  })
})

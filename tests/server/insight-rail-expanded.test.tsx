import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { InsightHeader } from '../../src/components/dashboard/InsightHeader'
import { InsightRail } from '../../src/components/dashboard/InsightRail'
import { CountryDrilldown } from '../../src/components/panels/CountryDrilldown'
import { DonorDrilldown } from '../../src/components/panels/DonorDrilldown'
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
  topSectors: [
    { label: 'Health', totalUsdM: 24000.2 },
    { label: 'Agriculture', totalUsdM: 9200.4 },
  ],
  topRecipients: [
    { label: 'Ukraine', totalUsdM: 990.1 },
    { label: 'Kenya', totalUsdM: 780.4 },
  ],
  topDonors: [
    { label: 'Gates Foundation', totalUsdM: 18890.4 },
    { label: 'UNICEF', totalUsdM: 12040.2 },
  ],
  yearlyFunding: [
    { year: 2021, totalUsdM: 18000.2 },
    { year: 2022, totalUsdM: 21200.7 },
    { year: 2023, totalUsdM: 29036.2 },
  ],
}

const donorSelection: DrilldownResponse = {
  donor: {
    id: 'gates-foundation',
    name: 'Gates Foundation',
    country: 'United States',
    totalUsdM: 18890.4,
    recipientCount: 78,
    topRecipientShare: 34.2,
    yearlyFunding: [
      { year: 2021, totalUsdM: 5100.3 },
      { year: 2022, totalUsdM: 6200.4 },
      { year: 2023, totalUsdM: 7589.7 },
    ],
    sectorBreakdown: [
      { sector: 'Health', totalUsdM: 10240.1 },
      { sector: 'Agriculture', totalUsdM: 3200.4 },
    ],
    topRecipients: [
      { iso3: 'UKR', name: 'Ukraine', totalUsdM: 6460.1 },
      { iso3: 'KEN', name: 'Kenya', totalUsdM: 3280.2 },
    ],
  },
  country: null,
}

const countrySelection: DrilldownResponse = {
  donor: null,
  country: {
    iso3: 'UKR',
    name: 'Ukraine',
    totalUsdM: 663.1,
    donorCount: 25,
    topDonorShare: 41.4,
    yearlyFunding: [
      { year: 2021, totalUsdM: 102.4 },
      { year: 2022, totalUsdM: 220.1 },
      { year: 2023, totalUsdM: 340.6 },
    ],
    sectorBreakdown: [
      { sector: 'Emergency', totalUsdM: 280.4 },
      { sector: 'Health', totalUsdM: 190.2 },
    ],
    topDonors: [
      { id: 'gates-foundation', name: 'Gates Foundation', country: 'United States', totalUsdM: 274.4 },
      { id: 'fcdo', name: 'FCDO', country: 'United Kingdom', totalUsdM: 150.3 },
    ],
  },
}

describe('expanded insight rail', () => {
  it('renders the compact identity header', () => {
    const html = renderToString(
      <InsightHeader eyebrow="Country" title="Ukraine" subtitle="Recipient focus" />,
    )

    expect(html).toContain('Ukraine')
    expect(html).toContain('Recipient focus')
  })

  it('renders idle overview analytics in the rail', () => {
    const html = renderToString(<InsightRail overview={overview} drilldown={{ donor: null, country: null }} />)

    expect(html).toContain('Platform overview')
    expect(html).toContain('Top sectors')
    expect(html).toContain('Top recipients')
    expect(html).toContain('Top donors')
    expect(html).toContain('Yearly distribution')
    expect(html).toContain('163')
    expect(html).toContain('Health')
    expect(html).toContain('$24,000.2M')
    expect(html).toContain('Gates Foundation')
  })

  it('renders donor stacked analysis sections', () => {
    const html = renderToString(<DonorDrilldown donor={donorSelection.donor!} />)

    expect(html).toContain('Sector mix')
    expect(html).toContain('Top recipients')
    expect(html).toContain('Yearly distribution')
    expect(html).toContain('Recipient reach')
    expect(html).toContain('78')
    expect(html).toContain('34.2% held by top recipient')
    expect(html).toContain('Ukraine')
  })

  it('renders country stacked analysis sections', () => {
    const html = renderToString(<CountryDrilldown country={countrySelection.country!} />)

    expect(html).toContain('Sector mix')
    expect(html).toContain('Top donors')
    expect(html).toContain('Yearly distribution')
    expect(html).toContain('Donor base')
    expect(html).toContain('25')
    expect(html).toContain('41.4% held by top donor')
    expect(html).toContain('FCDO')
  })

  it('renders the idle fallback copy when overview data is unavailable', () => {
    const html = renderToString(<InsightRail overview={null} drilldown={{ donor: null, country: null }} />)

    expect(html).toContain('Platform overview')
    expect(html).toContain('Overview')
    expect(html).toContain('Overview metrics and selection drilldowns load from the dashboard API.')
  })
})

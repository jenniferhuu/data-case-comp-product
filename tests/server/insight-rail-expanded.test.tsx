import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { InsightHeader } from '../../src/components/dashboard/InsightHeader'
import { InsightRail } from '../../src/components/dashboard/InsightRail'
import { CountryDrilldown } from '../../src/components/panels/CountryDrilldown'
import { DonorCountryDrilldown } from '../../src/components/panels/DonorCountryDrilldown'
import { DonorDrilldown } from '../../src/components/panels/DonorDrilldown'
import type { DrilldownResponse } from '../../src/contracts/drilldown'
import type { OverviewResponse } from '../../src/contracts/overview'
import { parseDashboardQuery } from '../../src/features/dashboard/queryState'
import { useDashboardState } from '../../src/features/dashboard/useDashboardState'

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
    { id: 'gates-foundation', label: 'Gates Foundation', totalUsdM: 18890.4, country: 'United States' },
    { id: 'unicef', label: 'UNICEF', totalUsdM: 12040.2, country: 'Global' },
  ],
  yearlyFunding: [
    { year: 2021, totalUsdM: 18000.2 },
    { year: 2022, totalUsdM: 21200.7 },
    { year: 2023, totalUsdM: 29036.2 },
  ],
  modalityBreakdown: [
    { label: 'Grants', totalUsdM: 64000.2 },
    { label: 'Loans', totalUsdM: 4236.9 },
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
    topImplementers: [
      { name: 'UNICEF', totalUsdM: 5000.1 },
      { name: 'PATH', totalUsdM: 2800.4 },
    ],
    modalityBreakdown: [
      { label: 'Grants', totalUsdM: 17000.1 },
      { label: 'Loans', totalUsdM: 1890.3 },
    ],
    flowGeography: {
      crossBorderPct: 92.4,
      domesticPct: 7.6,
    },
  },
  country: null,
  donorCountry: null,
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
    topImplementers: [
      { name: 'UNICEF', totalUsdM: 210.8 },
      { name: 'ICRC', totalUsdM: 150.2 },
    ],
  },
  donorCountry: null,
}

const donorCountrySelection: DrilldownResponse = {
  donor: null,
  country: null,
  donorCountry: {
    name: 'United States',
    totalUsdM: 22100.8,
    donorCount: 124,
    topDonors: [
      { id: 'gates-foundation', name: 'Gates Foundation', country: 'United States', totalUsdM: 9000.4 },
      { id: 'howard-g-buffett-foundation', name: 'Howard G. Buffett Foundation', country: 'United States', totalUsdM: 2800.1 },
    ],
    sectorBreakdown: [
      { sector: 'Health', totalUsdM: 11000.2 },
      { sector: 'Agriculture', totalUsdM: 4600.5 },
    ],
    yearlyFunding: [
      { year: 2021, totalUsdM: 6100.2 },
      { year: 2022, totalUsdM: 7200.3 },
      { year: 2023, totalUsdM: 8800.3 },
    ],
    topRecipients: [
      { iso3: 'UKR', name: 'Ukraine', totalUsdM: 5000.2 },
      { iso3: 'KEN', name: 'Kenya', totalUsdM: 3200.1 },
    ],
    topImplementers: [
      { name: 'UNICEF', totalUsdM: 4200.4 },
      { name: 'CARE', totalUsdM: 1800.2 },
    ],
    modalityBreakdown: [
      { label: 'Grants', totalUsdM: 21000.6 },
      { label: 'Loans', totalUsdM: 1100.2 },
    ],
    flowGeography: {
      crossBorderPct: 96.1,
      domesticPct: 3.9,
    },
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
    useDashboardState.getState().hydrateFromQuery(parseDashboardQuery())
    useDashboardState.getState().setGlobeStats({
      visibleFundingUsdM: 500,
      arcCount: 4,
      pointCount: 3,
      crossBorderPct: 80,
      domesticPct: 20,
    })
    const html = renderToString(<InsightRail overview={overview} drilldown={{ donor: null, country: null, donorCountry: null }} />)

    expect(html).toContain('Platform overview')
    expect(html).toContain('Top sectors')
    expect(html).toContain('Top recipients')
    expect(html).toContain('Top donors')
    expect(html).toContain('Yearly distribution')
    expect(html).toContain('Grants vs loans')
    expect(html).toContain('163')
    expect(html).toContain('Health')
    expect(html).toContain('$24,000.2M')
    expect(html).toContain('Gates Foundation')
  })

  it('renders donor stacked analysis sections', () => {
    const html = renderToString(<DonorDrilldown donor={donorSelection.donor!} />)

    expect(html).toContain('Flow geography')
    expect(html).toContain('Grants vs loans')
    expect(html).toContain('Sector mix')
    expect(html).toContain('Top recipients')
    expect(html).toContain('Yearly distribution')
    expect(html).toContain('Recipient reach')
    expect(html).toContain('78')
    expect(html).toContain('34.2% held by top recipient')
    expect(html).toContain('Top delivery channels')
    expect(html).toContain('UNICEF')
    expect(html).toContain('Ukraine')
  })

  it('renders donor-country stacked analysis sections', () => {
    const html = renderToString(<DonorCountryDrilldown donorCountry={donorCountrySelection.donorCountry!} />)

    expect(html).toContain('Flow geography')
    expect(html).toContain('Grants vs loans')
    expect(html).toContain('Sector mix')
    expect(html).toContain('Top donors')
    expect(html).toContain('Top recipients')
    expect(html).toContain('Yearly distribution')
    expect(html).toContain('United States')
    expect(html).toContain('UNICEF')
  })

  it('renders country stacked analysis sections', () => {
    const html = renderToString(<CountryDrilldown country={countrySelection.country!} />)

    expect(html).toContain('Sector mix')
    expect(html).toContain('Top donors')
    expect(html).toContain('Yearly distribution')
    expect(html).toContain('Donor base')
    expect(html).toContain('25')
    expect(html).toContain('41.4% held by top donor')
    expect(html).toContain('Top delivery channels')
    expect(html).toContain('ICRC')
    expect(html).toContain('FCDO')
  })

  it('renders the idle fallback copy when overview data is unavailable', () => {
    const html = renderToString(<InsightRail overview={null} drilldown={{ donor: null, country: null, donorCountry: null }} />)

    expect(html).toContain('Platform overview')
    expect(html).toContain('Overview')
    expect(html).toContain('Overview metrics and selection drilldowns load from the dashboard API.')
  })
})

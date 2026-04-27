import React from 'react'
import type { DrilldownResponse } from '../../contracts/drilldown'
import { InsightBarChart } from '../dashboard/InsightBarChart'
import { InsightHeader } from '../dashboard/InsightHeader'
import { InsightMetricCard } from '../dashboard/InsightMetricCard'
import { InsightRankList } from '../dashboard/InsightRankList'
import { InsightTrendChart } from '../dashboard/InsightTrendChart'

type CountryDrilldownData = NonNullable<DrilldownResponse['country']>

interface CountryDrilldownProps {
  country: CountryDrilldownData
  onSelectDonor?: (id: string) => void
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

export function CountryDrilldown({ country, onSelectDonor }: CountryDrilldownProps) {
  const donorCount = country.donorCount ?? 0
  const topDonorShare = country.topDonorShare ?? 0
  const sectorBreakdown = country.sectorBreakdown ?? []
  const topDonors = country.topDonors ?? []
  const topImplementers = country.topImplementers ?? []
  const yearlyFunding = country.yearlyFunding ?? []

  return (
    <div className="space-y-4">
      <InsightHeader
        eyebrow="Country focus"
        title={country.name}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InsightMetricCard
          label="Tracked recipient footprint"
          value={formatUsdMillions(country.totalUsdM)}
          detail={country.iso3}
        />
        <InsightMetricCard
          label="Donor base"
          value={donorCount.toLocaleString('en-US')}
          detail={`${topDonorShare.toFixed(1)}% held by top donor`}
        />
      </div>
      <InsightBarChart
        title="Sector mix"
        items={sectorBreakdown.map((item) => ({
          label: item.sector,
          totalUsdM: item.totalUsdM,
        }))}
      />
      <InsightRankList
        title="Top implementers"
        items={topImplementers.map((implementer) => ({
          label: implementer.name,
          value: formatUsdMillions(implementer.totalUsdM),
        }))}
      />
      <InsightRankList
        title="Top donors"
        items={topDonors.map((donor) => ({
          id: donor.id,
          label: donor.name,
          value: formatUsdMillions(donor.totalUsdM),
          detail: donor.country,
        }))}
        onSelect={onSelectDonor}
      />
      <InsightTrendChart title="Yearly distribution" points={yearlyFunding} />
    </div>
  )
}

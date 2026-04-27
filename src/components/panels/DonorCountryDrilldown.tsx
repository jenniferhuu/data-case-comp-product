import React from 'react'
import type { DrilldownResponse } from '../../contracts/drilldown'
import { InsightBarChart } from '../dashboard/InsightBarChart'
import { InsightHeader } from '../dashboard/InsightHeader'
import { InsightMetricCard } from '../dashboard/InsightMetricCard'
import { InsightRankList } from '../dashboard/InsightRankList'
import { InsightTrendChart } from '../dashboard/InsightTrendChart'

type DonorCountryData = NonNullable<DrilldownResponse['donorCountry']>

interface DonorCountryDrilldownProps {
  donorCountry: DonorCountryData
  onSelectDonor?: (id: string) => void
  onSelectCountry?: (iso3: string) => void
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

export function DonorCountryDrilldown({ donorCountry, onSelectDonor, onSelectCountry }: DonorCountryDrilldownProps) {
  return (
    <div className="space-y-4">
      <InsightHeader eyebrow="Donor country" title={donorCountry.name} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <InsightMetricCard
          label="Tracked funding"
          value={formatUsdMillions(donorCountry.totalUsdM)}
          detail={`${donorCountry.donorCount} active donors`}
        />
        <InsightMetricCard
          label="Recipient reach"
          value={donorCountry.topRecipients.length.toLocaleString('en-US')}
          detail="recipient countries"
        />
      </div>
      <InsightBarChart
        title="Sector mix"
        items={donorCountry.sectorBreakdown.map((item) => ({
          label: item.sector,
          totalUsdM: item.totalUsdM,
        }))}
      />
      <InsightRankList
        title="Top implementers"
        items={donorCountry.topImplementers.map((implementer) => ({
          label: implementer.name,
          value: formatUsdMillions(implementer.totalUsdM),
        }))}
      />
      <InsightRankList
        title="Top donors"
        items={donorCountry.topDonors.map((d) => ({
          id: d.id,
          label: d.name,
          value: formatUsdMillions(d.totalUsdM),
        }))}
        onSelect={onSelectDonor}
      />
      <InsightRankList
        title="Top recipients"
        items={donorCountry.topRecipients.map((r) => ({
          id: r.iso3,
          label: r.name,
          value: formatUsdMillions(r.totalUsdM),
        }))}
        onSelect={onSelectCountry}
      />
      <InsightTrendChart title="Yearly distribution" points={donorCountry.yearlyFunding} />
    </div>
  )
}

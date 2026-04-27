import React from 'react'
import type { DrilldownResponse } from '../../contracts/drilldown'
import { InsightBarChart } from '../dashboard/InsightBarChart'
import { InsightHeader } from '../dashboard/InsightHeader'
import { InsightMetricCard } from '../dashboard/InsightMetricCard'
import { InsightRankList } from '../dashboard/InsightRankList'
import { InsightTrendChart } from '../dashboard/InsightTrendChart'

type DonorDrilldownData = NonNullable<DrilldownResponse['donor']>

interface DonorDrilldownProps {
  donor: DonorDrilldownData
  onSelectCountry?: (iso3: string) => void
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

export function DonorDrilldown({ donor, onSelectCountry }: DonorDrilldownProps) {
  const recipientCount = donor.recipientCount ?? 0
  const topRecipientShare = donor.topRecipientShare ?? 0
  const sectorBreakdown = donor.sectorBreakdown ?? []
  const topRecipients = donor.topRecipients ?? []
  const yearlyFunding = donor.yearlyFunding ?? []

  return (
    <div className="space-y-4">
      <InsightHeader
        eyebrow="Donor"
        title={donor.name}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InsightMetricCard
          label="Total disclosed funding"
          value={formatUsdMillions(donor.totalUsdM)}
          detail={donor.id}
        />
        <InsightMetricCard
          label="Recipient reach"
          value={recipientCount.toLocaleString('en-US')}
          detail={`${topRecipientShare.toFixed(1)}% held by top recipient`}
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
        title="Top recipients"
        items={topRecipients.map((recipient) => ({
          id: recipient.iso3,
          label: recipient.name,
          value: formatUsdMillions(recipient.totalUsdM),
          detail: recipient.iso3,
        }))}
        onSelect={onSelectCountry}
      />
      <InsightTrendChart title="Yearly distribution" points={yearlyFunding} />
    </div>
  )
}

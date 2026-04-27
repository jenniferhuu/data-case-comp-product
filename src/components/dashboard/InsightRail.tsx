'use client'

import React, { useEffect, useState } from 'react'
import type { DrilldownResponse } from '../../contracts/drilldown'
import type { OverviewResponse } from '../../contracts/overview'
import { useDashboardState } from '../../features/dashboard/useDashboardState'
import { CountryDrilldown } from '../panels/CountryDrilldown'
import { DonorDrilldown } from '../panels/DonorDrilldown'
import { InsightBarChart } from './InsightBarChart'
import { InsightHeader } from './InsightHeader'
import { InsightMetricCard } from './InsightMetricCard'
import { InsightRankList } from './InsightRankList'
import { InsightTrendChart } from './InsightTrendChart'

interface InsightRailProps {
  overview: OverviewResponse | null
  drilldown?: DrilldownResponse
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value >= 1000 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

export function InsightRail({ overview, drilldown }: InsightRailProps) {
  const selectionType = useDashboardState((state) => state.selectionType)
  const selectionId = useDashboardState((state) => state.selectionId)
  const selectCountry = useDashboardState((state) => state.selectCountry)
  const selectDonor = useDashboardState((state) => state.selectDonor)
  const donorCountry = useDashboardState((state) => state.donorCountry)
  const [liveDrilldown, setLiveDrilldown] = useState<DrilldownResponse | null>(drilldown ?? null)

  useEffect(() => {
    if (drilldown !== undefined) {
      setLiveDrilldown(drilldown)
      return
    }

    let cancelled = false
    setLiveDrilldown(null)
    const searchParams = new URLSearchParams()

    if (selectionType !== undefined && selectionId !== undefined) {
      searchParams.set('selectionType', selectionType)
      searchParams.set('selectionId', selectionId)
    }

    const href = searchParams.size === 0 ? '/api/drilldown' : `/api/drilldown?${searchParams.toString()}`

    void fetch(href)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Drilldown request failed')
        }

        return response.json() as Promise<DrilldownResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setLiveDrilldown(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveDrilldown(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [drilldown, selectionId, selectionType])

  const activeDonor = liveDrilldown?.donor ?? null
  const activeCountry = liveDrilldown?.country ?? null
  const leadHighlight = overview?.highlights[0] ?? null
  const topSectors = overview?.topSectors ?? []
  const topRecipients = overview?.topRecipients ?? []
  const allTopDonors = overview?.topDonors ?? []
  const topDonors = donorCountry !== null && donorCountry !== undefined
    ? allTopDonors.filter((d) => d.country === donorCountry).slice(0, 6)
    : allTopDonors.slice(0, 6)
  const yearlyFunding = overview?.yearlyFunding ?? []
  const fallbackContext = overview === null
    ? 'Overview metrics and selection drilldowns load from the dashboard API.'
    : `Use the globe to move from platform totals into donor and country drilldowns.`

  return (
    <aside className="border-l border-white/10 bg-slate-950/45 px-5 pb-8 pt-36 backdrop-blur lg:h-screen lg:min-h-0 lg:overflow-hidden xl:px-6">
      <div className="space-y-6 lg:h-full lg:overflow-y-auto lg:pr-2">
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Insights</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Selection-driven analysis</h2>
          <p className="mt-2 text-sm text-slate-300">
            {leadHighlight === null
              ? fallbackContext
              : `${leadHighlight.label}: ${leadHighlight.value}`}
          </p>
        </section>

        {activeDonor !== null ? <DonorDrilldown donor={activeDonor} onSelectCountry={selectCountry} /> : null}
        {activeCountry !== null ? <CountryDrilldown country={activeCountry} onSelectDonor={selectDonor} /> : null}

        {activeDonor === null && activeCountry === null ? (
          <div className="space-y-4">
            <InsightHeader
              eyebrow="Portfolio"
              title="Platform overview"
            />
            {overview !== null ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InsightMetricCard
                  label="Tracked recipient footprint"
                  value={overview.totals.countries.toLocaleString('en-US')}
                  detail="recipient countries"
                />
                <InsightMetricCard
                  label="Active donor base"
                  value={overview.totals.donors.toLocaleString('en-US')}
                  detail={`${overview.totals.corridors.toLocaleString('en-US')} funding corridors`}
                />
              </div>
            ) : (
              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm font-medium text-white">Overview</p>
                <p className="mt-2 text-sm text-slate-300">
                  Overview metrics and selection drilldowns load from the dashboard API.
                </p>
              </section>
            )}
          </div>
        ) : null}

        {activeDonor === null && activeCountry === null && overview !== null ? (
          <>
            <InsightBarChart title="Top sectors" items={topSectors} />
            <InsightRankList
              title="Top recipients"
              items={topRecipients.map((recipient) => ({
                id: recipient.id,
                label: recipient.label,
                value: formatUsdMillions(recipient.totalUsdM),
              }))}
              onSelect={(iso3) => selectCountry(iso3)}
            />
            <InsightRankList
              title={donorCountry !== null && donorCountry !== undefined ? `Top donors · ${donorCountry}` : 'Top donors'}
              items={topDonors.map((donor) => ({
                id: donor.id,
                label: donor.label,
                value: formatUsdMillions(donor.totalUsdM),
              }))}
              onSelect={(id) => selectDonor(id ?? null)}
            />
            <InsightTrendChart title="Yearly distribution" points={yearlyFunding} />
          </>
        ) : null}
      </div>
    </aside>
  )
}

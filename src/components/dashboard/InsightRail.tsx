'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { DrilldownResponse } from '../../contracts/drilldown'
import type { OverviewResponse } from '../../contracts/overview'
import { createDashboardSearchParams } from '../../features/dashboard/queryState'
import { useDashboardState } from '../../features/dashboard/useDashboardState'
import { CountryDrilldown } from '../panels/CountryDrilldown'
import { DonorCountryDrilldown } from '../panels/DonorCountryDrilldown'
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

function ModalityDonut({ items }: { items: OverviewResponse['modalityBreakdown'] }) {
  const grantValue = items.find((item) => item.label === 'Grants')?.totalUsdM ?? 0
  const loanValue = items.find((item) => item.label === 'Loans')?.totalUsdM ?? 0
  const total = grantValue + loanValue
  const grantPct = total > 0 ? (grantValue / total) * 100 : 0

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">Grants vs loans</h4>
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Mode split</p>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div
          className="h-20 w-20 rounded-full border border-white/10"
          style={{
            background: `conic-gradient(#22d3ee 0 ${grantPct}%, rgba(255,255,255,0.12) ${grantPct}% 100%)`,
          }}
        />
        <div className="space-y-2 text-sm">
          <p className="text-cyan-300">Grants {formatUsdMillions(grantValue)}</p>
          <p className="text-slate-300">Loans {formatUsdMillions(loanValue)}</p>
        </div>
      </div>
    </section>
  )
}

export function InsightRail({ overview, drilldown }: InsightRailProps) {
  const yearMode = useDashboardState((state) => state.yearMode)
  const year = useDashboardState((state) => state.year)
  const compareFrom = useDashboardState((state) => state.compareFrom)
  const compareTo = useDashboardState((state) => state.compareTo)
  const valueMode = useDashboardState((state) => state.valueMode)
  const donor = useDashboardState((state) => state.donor)
  const recipientCountry = useDashboardState((state) => state.recipientCountry)
  const sector = useDashboardState((state) => state.sector)
  const selectionType = useDashboardState((state) => state.selectionType)
  const selectionId = useDashboardState((state) => state.selectionId)
  const selectCountry = useDashboardState((state) => state.selectCountry)
  const selectDonor = useDashboardState((state) => state.selectDonor)
  const donorCountry = useDashboardState((state) => state.donorCountry)
  const globeStats = useDashboardState((state) => state.globeStats)
  const [liveDrilldown, setLiveDrilldown] = useState<DrilldownResponse | null>(drilldown ?? null)

  const drilldownQueryString = useMemo(
    () =>
      createDashboardSearchParams({
        yearMode,
        year,
        compareFrom,
        compareTo,
        valueMode,
        donor,
        donorCountry,
        recipientCountry,
        sector,
        marker: undefined,
        selectionType,
        selectionId,
      }).toString(),
    [
      compareFrom,
      compareTo,
      donor,
      donorCountry,
      recipientCountry,
      sector,
      selectionId,
      selectionType,
      valueMode,
      year,
      yearMode,
    ],
  )

  useEffect(() => {
    if (drilldown !== undefined) {
      setLiveDrilldown(drilldown)
      return
    }

    let cancelled = false
    setLiveDrilldown(null)
    const href = drilldownQueryString.length === 0 ? '/api/drilldown' : `/api/drilldown?${drilldownQueryString}`

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
  }, [drilldown, drilldownQueryString])

  const activeDonor = liveDrilldown?.donor ?? null
  const activeCountry = liveDrilldown?.country ?? null
  const activeDonorCountry = liveDrilldown?.donorCountry ?? null
  const leadHighlight = overview?.highlights[0] ?? null
  const topSectors = overview?.topSectors ?? []
  const topRecipients = overview?.topRecipients ?? []
  const allTopDonors = overview?.topDonors ?? []
  const topDonors = donorCountry !== null && donorCountry !== undefined
    ? allTopDonors.filter((d) => d.country === donorCountry).slice(0, 6)
    : allTopDonors.slice(0, 6)
  const yearlyFunding = overview?.yearlyFunding ?? []
  const modalityBreakdown = overview?.modalityBreakdown ?? []
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
        {activeDonorCountry !== null ? (
          <DonorCountryDrilldown
            donorCountry={activeDonorCountry}
            onSelectDonor={selectDonor}
            onSelectCountry={selectCountry}
          />
        ) : null}

        {activeDonor === null && activeCountry === null && activeDonorCountry === null ? (
          <div className="space-y-4">
            <InsightHeader
              eyebrow="Portfolio"
              title="Platform overview"
            />
            {overview !== null ? (
              <div className="space-y-3">
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
                {globeStats !== null && (
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Flow geography</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-cyan-400"
                          style={{ width: `${globeStats.crossBorderPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
                        Cross-border {globeStats.crossBorderPct}%
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="inline-block h-2 w-2 rounded-full bg-white/20" />
                        Domestic {globeStats.domesticPct}%
                      </span>
                    </div>
                  </div>
                )}
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

        {activeDonor === null && activeCountry === null && activeDonorCountry === null && overview !== null ? (
          <>
            <ModalityDonut items={modalityBreakdown} />
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

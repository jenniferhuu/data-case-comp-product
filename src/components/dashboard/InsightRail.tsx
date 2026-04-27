'use client'

import React, { useEffect, useState } from 'react'
import type { DrilldownResponse } from '../../contracts/drilldown'
import type { OverviewResponse } from '../../contracts/overview'
import { useDashboardState } from '../../features/dashboard/useDashboardState'
import { CountryDrilldown } from '../panels/CountryDrilldown'
import { DonorDrilldown } from '../panels/DonorDrilldown'
import { TrendDrawer, type TrendDrawerItem } from './TrendDrawer'

interface InsightRailProps {
  overview?: OverviewResponse
  drilldown?: DrilldownResponse
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value >= 1000 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

function buildIdleItems(overview: OverviewResponse): TrendDrawerItem[] {
  return [
    {
      label: 'Tracked recipient footprint',
      value: `${overview.totals.countries.toLocaleString('en-US')} countries`,
    },
    {
      label: 'Active donor base',
      value: `${overview.totals.donors.toLocaleString('en-US')} donors`,
    },
    {
      label: 'Funding corridors',
      value: overview.totals.corridors.toLocaleString('en-US'),
    },
  ]
}

function buildDonorItems(drilldown: NonNullable<DrilldownResponse['donor']>): TrendDrawerItem[] {
  return [
    { label: 'Home market', value: drilldown.country },
    { label: 'Disclosed funding', value: formatUsdMillions(drilldown.totalUsdM) },
    { label: 'Selection id', value: drilldown.id },
  ]
}

function buildCountryItems(drilldown: NonNullable<DrilldownResponse['country']>): TrendDrawerItem[] {
  return [
    { label: 'Tracked recipient footprint', value: drilldown.name },
    { label: 'ISO3', value: drilldown.iso3 },
    { label: 'Disclosed funding', value: formatUsdMillions(drilldown.totalUsdM) },
  ]
}

export function InsightRail({ overview, drilldown }: InsightRailProps) {
  const selectionType = useDashboardState((state) => state.selectionType)
  const selectionId = useDashboardState((state) => state.selectionId)
  const [liveOverview, setLiveOverview] = useState<OverviewResponse | null>(overview ?? null)
  const [liveDrilldown, setLiveDrilldown] = useState<DrilldownResponse | null>(drilldown ?? null)

  useEffect(() => {
    if (overview !== undefined) {
      setLiveOverview(overview)
      return
    }

    let cancelled = false

    void fetch('/api/overview')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Overview request failed')
        }

        return response.json() as Promise<OverviewResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setLiveOverview(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveOverview(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [overview])

  useEffect(() => {
    if (drilldown !== undefined) {
      setLiveDrilldown(drilldown)
      return
    }

    let cancelled = false
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
  const leadHighlight = liveOverview?.highlights[0] ?? null

  return (
    <aside className="border-l border-white/10 bg-slate-950/45 px-6 py-28 backdrop-blur">
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Insights</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Selection-driven analysis</h2>
          <p className="mt-2 text-sm text-slate-300">
            {leadHighlight === null
              ? 'Overview metrics and selection drilldowns load from the dashboard API.'
              : `${leadHighlight.label}: ${leadHighlight.value}`}
          </p>
        </section>

        {activeDonor !== null ? <DonorDrilldown donor={activeDonor} /> : null}
        {activeCountry !== null ? <CountryDrilldown country={activeCountry} /> : null}

        {activeDonor === null && activeCountry === null ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Overview state</p>
            <p className="mt-2 text-sm text-slate-300">
              Select a donor or recipient to swap this rail from platform-level metrics into a focused drilldown.
            </p>
          </section>
        ) : null}

        {activeDonor !== null ? (
          <TrendDrawer eyebrow="Drilldown" title="Donor concentration snapshot" items={buildDonorItems(activeDonor)} />
        ) : null}

        {activeCountry !== null ? (
          <TrendDrawer eyebrow="Drilldown" title="Tracked recipient footprint" items={buildCountryItems(activeCountry)} />
        ) : null}

        {activeDonor === null && activeCountry === null && liveOverview !== null ? (
          <TrendDrawer eyebrow="Portfolio" title="Platform overview" items={buildIdleItems(liveOverview)} />
        ) : null}
      </div>
    </aside>
  )
}

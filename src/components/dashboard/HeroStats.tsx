'use client'

import React from 'react'
import type { OverviewResponse } from '../../contracts/overview'
import { useDashboardState } from '../../features/dashboard/useDashboardState'

interface HeroStatsProps {
  overview: OverviewResponse | null
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value >= 1000 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

export function HeroStats({ overview }: HeroStatsProps) {
  const globeStats = useDashboardState((state) => state.globeStats)
  const valueMode = useDashboardState((state) => state.valueMode)
  const leadHighlight = overview?.highlights[0] ?? null
  const fallbackContext = overview === null
    ? 'Loading cross-border funding totals and portfolio context.'
    : `Tracking ${overview.totals.donors.toLocaleString('en-US')} donors across ${overview.totals.countries.toLocaleString('en-US')} recipient countries.`

  const stats = [
    {
      label: 'Visible funding',
      value: globeStats === null ? '—' : formatUsdMillions(globeStats.visibleFundingUsdM),
    },
    {
      label: 'Live corridors',
      value: globeStats === null ? '—' : globeStats.arcCount.toLocaleString('en-US'),
    },
    {
      label: 'Recipient countries',
      value: globeStats === null ? '—' : globeStats.pointCount.toLocaleString('en-US'),
    },
  ]

  if (valueMode === 'commitments') {
    stats.push({
      label: 'Commitments disbursed',
      value: overview === null ? '—' : `${overview.commitmentProgress.disbursedPct.toFixed(1)}%`,
    })
  }

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4">
      <div className="mx-auto flex max-w-[88rem] flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/65 px-4 py-3 backdrop-blur-xl">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">PhilanthroGlobe</p>
          <h1 className="mt-1.5 text-xl font-semibold text-white">Global funding command center</h1>
          <p className="mt-2 text-sm text-slate-300">
            {leadHighlight === null
              ? fallbackContext
              : `${leadHighlight.label}: ${leadHighlight.value}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-28 rounded-[1.15rem] border border-white/10 bg-white/5 px-3.5 py-2.5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{stat.label}</p>
              <p className="mt-1 text-base font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}

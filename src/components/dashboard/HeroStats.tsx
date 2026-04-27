'use client'

import React from 'react'
import type { OverviewResponse } from '../../contracts/overview'

interface HeroStatsProps {
  overview: OverviewResponse | null
}

interface HeroStatCard {
  label: string
  value: string
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value >= 1000 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

function buildHeroCards(overview: OverviewResponse): HeroStatCard[] {
  return [
    { label: 'Funding tracked', value: formatUsdMillions(overview.totals.fundingUsdM) },
    { label: 'Tracked donors', value: overview.totals.donors.toLocaleString('en-US') },
    { label: 'Recipient countries', value: overview.totals.countries.toLocaleString('en-US') },
    { label: 'Funding corridors', value: overview.totals.corridors.toLocaleString('en-US') },
  ]
}

export function HeroStats({ overview }: HeroStatsProps) {
  const heroCards = overview === null ? [] : buildHeroCards(overview)
  const leadHighlight = overview?.highlights[0] ?? null
  const fallbackContext = overview === null
    ? 'Loading cross-border funding totals and portfolio context.'
    : `Tracking ${overview.totals.donors.toLocaleString('en-US')} donors across ${overview.totals.countries.toLocaleString('en-US')} recipient countries.`

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
          {heroCards.map((stat) => (
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

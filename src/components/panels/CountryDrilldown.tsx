import React from 'react'
import type { DrilldownResponse } from '../../contracts/drilldown'

type CountryDrilldownData = NonNullable<DrilldownResponse['country']>

interface CountryDrilldownProps {
  country: CountryDrilldownData
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

export function CountryDrilldown({ country }: CountryDrilldownProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Country focus</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{country.name}</h3>
      <p className="mt-1 text-sm text-slate-300">{country.iso3}</p>
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tracked recipient footprint</p>
        <p className="mt-1 text-lg font-semibold text-white">{formatUsdMillions(country.totalUsdM)}</p>
      </div>
    </section>
  )
}

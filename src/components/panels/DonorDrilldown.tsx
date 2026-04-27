import React from 'react'
import type { DrilldownResponse } from '../../contracts/drilldown'

type DonorDrilldownData = NonNullable<DrilldownResponse['donor']>

interface DonorDrilldownProps {
  donor: DonorDrilldownData
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

export function DonorDrilldown({ donor }: DonorDrilldownProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Donor focus</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{donor.name}</h3>
      <p className="mt-1 text-sm text-slate-300">{donor.country}</p>
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total disclosed funding</p>
        <p className="mt-1 text-lg font-semibold text-white">{formatUsdMillions(donor.totalUsdM)}</p>
      </div>
    </section>
  )
}

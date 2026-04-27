import React from 'react'
import { DELTA_COLOR_RAMPS, SECTOR_COLORS } from '../../lib/colorScales'

const STANDARD_SECTORS = Object.keys(SECTOR_COLORS) as Array<keyof typeof SECTOR_COLORS>
const VOLUME_STEPS = ['Lower volume', 'Mid volume', 'Higher volume'] as const

export function GlobeLegend({ compareMode }: { compareMode: boolean }) {
  if (compareMode) {
    return (
      <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/78 px-4 py-3 text-xs text-slate-100 shadow-[0_20px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
        <p className="uppercase tracking-[0.24em] text-emerald-200/75">Compare legend</p>
        <div className="mt-3 grid gap-2">
          <LegendRow color={DELTA_COLOR_RAMPS.positive[1]} label="Green = positive delta" />
          <LegendRow color={DELTA_COLOR_RAMPS.neutral[1]} label="Gray = neutral midpoint" />
          <LegendRow color={DELTA_COLOR_RAMPS.negative[1]} label="Red = negative delta" />
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-300">
          Color shows direction of change across the selected comparison years, while line weight continues to show
          visible funding volume.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/78 px-4 py-3 text-xs text-slate-100 shadow-[0_20px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
      <p className="uppercase tracking-[0.24em] text-cyan-200/75">Flow legend</p>
      <div className="mt-3 grid gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Sector</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STANDARD_SECTORS.map((sector) => (
              <span
                key={sector}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px]"
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SECTOR_COLORS[sector as string] ?? SECTOR_COLORS.Other }}
                />
                {sector}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Volume</p>
          <div className="mt-2 grid gap-1.5">
            {VOLUME_STEPS.map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="rounded-full bg-cyan-200/90"
                  style={{ height: `${3 + index * 2}px`, width: `${16 + index * 8}px` }}
                />
                <span className="text-[11px] text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-slate-300">Color shows sector and line weight shows funding volume.</p>
    </div>
  )
}

function LegendRow({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="h-2.5 w-8 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}

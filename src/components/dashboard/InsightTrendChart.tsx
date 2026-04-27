import React from 'react'

interface InsightTrendPoint {
  year: number
  totalUsdM: number
}

interface InsightTrendChartProps {
  title: string
  points: InsightTrendPoint[]
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value >= 1000 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

export function InsightTrendChart({ title, points }: InsightTrendChartProps) {
  const maxValue = points.reduce((highest, point) => Math.max(highest, point.totalUsdM), 0)
  const path = points
    .map((point, index) => {
      const x = points.length === 1 ? 120 : (index / (points.length - 1)) * 240
      const y = maxValue === 0 ? 64 : 72 - (point.totalUsdM / maxValue) * 56

      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Timeline</p>
      </div>
      <div className="mt-4 rounded-[1.25rem] border border-white/8 bg-slate-950/55 p-3">
        <svg viewBox="0 0 240 80" className="h-24 w-full" role="img" aria-label={title}>
          <path d={path} fill="none" stroke="rgba(34,211,238,0.95)" strokeWidth="3" strokeLinecap="round" />
          {points.map((point, index) => {
            const x = points.length === 1 ? 120 : (index / (points.length - 1)) * 240
            const y = maxValue === 0 ? 64 : 72 - (point.totalUsdM / maxValue) * 56

            return <circle key={point.year} cx={x} cy={y} r="3.5" fill="#bef264" />
          })}
        </svg>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {points.map((point) => (
            <div key={point.year} className="rounded-xl bg-white/[0.04] px-2.5 py-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{point.year}</p>
              <p className="mt-1 text-xs font-medium text-slate-200">{formatUsdMillions(point.totalUsdM)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

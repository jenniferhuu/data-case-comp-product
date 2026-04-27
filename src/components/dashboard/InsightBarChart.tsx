import React from 'react'

interface InsightBarChartItem {
  label: string
  totalUsdM: number
}

interface InsightBarChartProps {
  title: string
  items: InsightBarChartItem[]
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value >= 1000 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

export function InsightBarChart({ title, items }: InsightBarChartProps) {
  const maxValue = items.reduce((highest, item) => Math.max(highest, item.totalUsdM), 0)

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">USD M</p>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const width = maxValue === 0 ? 0 : Math.max(8, (item.totalUsdM / maxValue) * 100)

          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-slate-200">{item.label}</p>
                <p className="text-xs font-medium text-slate-300">{formatUsdMillions(item.totalUsdM)}</p>
              </div>
              <div className="h-2 rounded-full bg-slate-900/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-300"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

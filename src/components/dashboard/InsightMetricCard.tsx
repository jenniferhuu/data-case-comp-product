import React from 'react'

interface InsightMetricCardProps {
  label: string
  value: string
  detail?: string
}

export function InsightMetricCard({ label, value, detail }: InsightMetricCardProps) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/55 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-400">{detail}</p> : null}
    </div>
  )
}

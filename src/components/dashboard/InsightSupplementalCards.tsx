import React from 'react'

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value >= 1000 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

interface ModalityBreakdownItem {
  label: string
  totalUsdM: number
}

export function ModalityDonut({ items }: { items: ModalityBreakdownItem[] }) {
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

export function FlowGeographyCard({
  crossBorderPct,
  domesticPct,
}: {
  crossBorderPct: number
  domesticPct: number
}) {
  return (
    <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Flow geography</p>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-cyan-400"
            style={{ width: `${crossBorderPct}%` }}
          />
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="flex items-center gap-1.5 text-cyan-300">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
          Cross-border {crossBorderPct}%
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-white/20" />
          Domestic {domesticPct}%
        </span>
      </div>
    </section>
  )
}

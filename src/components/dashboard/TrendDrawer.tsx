import React from 'react'

export interface TrendDrawerItem {
  label: string
  value: string
}

interface TrendDrawerProps {
  eyebrow: string
  title: string
  items: TrendDrawerItem[]
}

export function TrendDrawer({ eyebrow, title, items }: TrendDrawerProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">{eyebrow}</p>
      <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-slate-100">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

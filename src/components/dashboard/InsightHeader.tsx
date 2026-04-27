import React from 'react'

interface InsightHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
}

export function InsightHeader({ eyebrow, title, subtitle }: InsightHeaderProps) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
      <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-300">{subtitle}</p> : null}
    </section>
  )
}

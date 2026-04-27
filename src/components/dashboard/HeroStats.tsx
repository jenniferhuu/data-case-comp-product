import React from 'react'

interface HeroStatItem {
  label: string
  value: string
}

const HERO_STATS: HeroStatItem[] = [
  { label: 'Tracked donors', value: '180+' },
  { label: 'Recipient markets', value: '120' },
  { label: 'Years covered', value: '2018-2024' },
]

export function HeroStats() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-6 pt-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/65 px-5 py-4 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">PhilanthroGlobe</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Global funding command center</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="min-w-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}

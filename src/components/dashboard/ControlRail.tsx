import React from 'react'

export function ControlRail() {
  return (
    <aside className="border-r border-white/10 bg-slate-950/45 px-6 py-28 backdrop-blur">
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Controls</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Filter the global flow map</h2>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Control rail scaffold</p>
          <p className="mt-2 text-sm text-slate-300">
            Task 8 keeps this rail static until live query state is wired into the shell.
          </p>
        </section>
        <section className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
            Year mode, compare state, and filters will mount here.
          </div>
          <div className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-4 text-sm text-cyan-100">
            Query-safe dashboard controls are scaffolded for the Next.js shell.
          </div>
        </section>
      </div>
    </aside>
  )
}

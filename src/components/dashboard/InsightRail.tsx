import React from 'react'

export function InsightRail() {
  return (
    <aside className="border-l border-white/10 bg-slate-950/45 px-6 py-28 backdrop-blur">
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Insights</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Selection-driven analysis</h2>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Default state</p>
          <p className="mt-2 text-sm text-slate-300">
            No donor or country selected. The shell is ready for drilldown content in later tasks.
          </p>
        </section>
        <section className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
            Rankings, highlights, and explainers will render in this rail.
          </div>
          <div className="rounded-2xl border border-dashed border-emerald-400/30 bg-emerald-400/5 p-4 text-sm text-emerald-100">
            The dashboard shell reserves space for drilldowns without coupling to legacy panels.
          </div>
        </section>
      </div>
    </aside>
  )
}

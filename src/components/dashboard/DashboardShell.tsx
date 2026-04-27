import React from 'react'
import { ControlRail } from './ControlRail'
import { HeroStats } from './HeroStats'
import { InsightRail } from './InsightRail'

export function DashboardShell() {
  return (
    <main data-testid="dashboard-shell" className="dashboard-shell min-h-screen">
      <HeroStats />
      <div className="grid min-h-screen grid-cols-1 bg-[radial-gradient(circle_at_top,#153153_0%,#09111f_58%,#050913_100%)] lg:grid-cols-[320px_minmax(0,1fr)_380px]">
        <ControlRail />
        <section
          id="globe-stage"
          className="relative flex min-h-[28rem] items-center justify-center overflow-hidden px-6 py-28"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_48%)]" />
          <div className="absolute inset-8 rounded-[2rem] border border-white/10 bg-white/[0.03]" />
          <div className="relative max-w-xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Globe Stage</p>
            <h2 className="mt-4 text-4xl font-semibold text-white">A dedicated interaction canvas for funding flows</h2>
            <p className="mt-4 text-base text-slate-300">
              Task 8 establishes the dashboard frame so later tasks can mount the globe scene, idle behavior, and
              drilldowns without changing the page boundary.
            </p>
          </div>
        </section>
        <InsightRail />
      </div>
    </main>
  )
}

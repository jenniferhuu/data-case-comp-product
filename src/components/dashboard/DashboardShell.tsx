import React from 'react'
import { ControlRail } from './ControlRail'
import { HeroStats } from './HeroStats'
import { InsightRail } from './InsightRail'
import { GlobeIdleController } from '../globe/GlobeIdleController'
import { GlobeScene } from '../globe/GlobeScene'

export function DashboardShell() {
  return (
    <main data-testid="dashboard-shell" className="dashboard-shell min-h-screen">
      <HeroStats />
      <div className="grid min-h-screen grid-cols-1 bg-[radial-gradient(circle_at_top,#153153_0%,#09111f_58%,#050913_100%)] lg:grid-cols-[320px_minmax(0,1fr)_380px]">
        <ControlRail />
        <section
          id="globe-stage"
          className="relative min-h-screen overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_48%)]" />
          <div className="absolute inset-8 rounded-[2rem] border border-white/10 bg-white/[0.03]" />
          <div className="relative h-full min-h-screen w-full">
            <GlobeIdleController />
            <GlobeScene />
          </div>
        </section>
        <InsightRail />
      </div>
    </main>
  )
}

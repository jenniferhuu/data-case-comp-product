'use client'

import React, { useEffect, useState } from 'react'
import type { OverviewResponse } from '../../contracts/overview'
import { ControlRail } from './ControlRail'
import { HeroStats } from './HeroStats'
import { InsightRail } from './InsightRail'
import { GlobeIdleController } from '../Globe/GlobeIdleController'
import { GlobeScene } from '../Globe/GlobeScene'

function useOverviewData() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetch('/api/overview')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Overview request failed')
        }

        return response.json() as Promise<OverviewResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setOverview(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOverview(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return overview
}

export function DashboardShell() {
  const overview = useOverviewData()

  return (
    <main data-testid="dashboard-shell" className="dashboard-shell min-h-screen lg:h-screen lg:overflow-hidden">
      <HeroStats overview={overview} />
      <div className="grid min-h-screen grid-cols-1 bg-[radial-gradient(circle_at_top,#153153_0%,#09111f_58%,#050913_100%)] lg:h-screen lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <ControlRail />
        <section
          id="globe-stage"
          className="relative min-h-screen overflow-hidden lg:min-h-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_48%)]" />
          <div className="absolute inset-5 rounded-[1.75rem] border border-white/10 bg-white/[0.03]" />
          <div className="relative h-full min-h-screen w-full lg:min-h-0">
            <GlobeIdleController />
            <GlobeScene />
          </div>
        </section>
        <InsightRail overview={overview} />
      </div>
    </main>
  )
}

'use client'

import React from 'react'
import dynamic from 'next/dynamic'

function GlobeLoadingState() {
  return (
    <div className="flex h-full min-h-screen items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Globe loading</p>
        <h2 className="mt-4 text-4xl font-semibold text-white">Preparing the interactive funding map</h2>
        <p className="mt-4 text-base text-slate-300">
          The globe scene is loading client-side so flows, camera motion, and selection behavior can hydrate without
          blocking the dashboard shell.
        </p>
      </div>
    </div>
  )
}

const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: GlobeLoadingState,
})

export function GlobeScene() {
  return (
    <div className="globe-canvas h-full w-full">
      <Globe />
    </div>
  )
}

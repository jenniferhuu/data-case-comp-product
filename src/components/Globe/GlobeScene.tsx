'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false })

export function GlobeScene() {
  return (
    <div className="globe-canvas h-full w-full">
      <Globe />
    </div>
  )
}

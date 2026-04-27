'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { createDashboardSearchParams } from '../../features/dashboard/queryState'
import { useDashboardState } from '../../features/dashboard/useDashboardState'
import type { GlobeResponse } from '../../contracts/globe'
import { buildGlobePresentation, type GlobeArcDatum, type GlobePointDatum } from './globePresentation'

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
}) as any

interface GeoCountry {
  iso3: string
  name: string
  lat: number
  lon: number
  continent: string
}

const EARTH_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-night.jpg'
const STARFIELD_TEXTURE = 'https://unpkg.com/three-globe/example/img/night-sky.png'

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value >= 1000 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

function getArcColor(arc: GlobeArcDatum, compareMode: boolean) {
  if (compareMode) {
    const latestYear = arc.years.at(-1) ?? 0
    const earliestYear = arc.years[0] ?? latestYear

    return latestYear > earliestYear ? ['#6ee7ff', '#7c3aed'] : ['#fbbf24', '#f97316']
  }

  if (arc.amountUsdM >= 500) {
    return ['#f5d66b', '#f59e0b']
  }

  if (arc.amountUsdM >= 100) {
    return ['#67e8f9', '#22d3ee']
  }

  return ['#7dd3fc', '#38bdf8']
}

function getPointColor(point: GlobePointDatum) {
  if (point.totalUsdM >= 500) {
    return '#facc15'
  }

  if (point.totalUsdM >= 100) {
    return '#38bdf8'
  }

  return '#67e8f9'
}

export function GlobeScene() {
  const globeRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 1000, height: 820 })
  const [geo, setGeo] = useState<GeoCountry[]>([])
  const [globeResponse, setGlobeResponse] = useState<GlobeResponse | null>(null)
  const [hoveredArc, setHoveredArc] = useState<GlobeArcDatum | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<GlobePointDatum | null>(null)
  const idleMode = useDashboardState((state) => state.idleMode)
  const yearMode = useDashboardState((state) => state.yearMode)
  const year = useDashboardState((state) => state.year)
  const compareFrom = useDashboardState((state) => state.compareFrom)
  const compareTo = useDashboardState((state) => state.compareTo)
  const donorCountry = useDashboardState((state) => state.donorCountry)
  const sector = useDashboardState((state) => state.sector)
  const selectedCountryIso3 = useDashboardState((state) => state.selectedCountryIso3)
  const selectedDonorId = useDashboardState((state) => state.selectedDonorId)
  const selectCountry = useDashboardState((state) => state.selectCountry)
  const selectDonor = useDashboardState((state) => state.selectDonor)
  const setIdleMode = useDashboardState((state) => state.setIdleMode)

  const globeQueryString = useMemo(
    () =>
      createDashboardSearchParams({
        yearMode,
        year,
        compareFrom,
        compareTo,
        donorCountry,
        sector,
        marker: undefined,
        selectionType: undefined,
        selectionId: undefined,
      }).toString(),
    [compareFrom, compareTo, donorCountry, sector, year, yearMode],
  )

  useEffect(() => {
    const node = containerRef.current

    if (node === null) {
      return
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]

      if (entry === undefined) {
        return
      }

      setSize({
        width: Math.max(720, Math.floor(entry.contentRect.width)),
        height: Math.max(680, Math.floor(entry.contentRect.height)),
      })
    })

    resizeObserver.observe(node)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void fetch('/data/countries_geo.json')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Geo data request failed')
        }

        return response.json() as Promise<GeoCountry[]>
      })
      .then((data) => {
        if (!cancelled) {
          setGeo(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGeo([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const href = globeQueryString.length === 0 ? '/api/globe' : `/api/globe?${globeQueryString}`

    void fetch(href)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Globe request failed')
        }

        return response.json() as Promise<GlobeResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setGlobeResponse(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGlobeResponse({ flows: [] })
        }
      })

    return () => {
      cancelled = true
    }
  }, [globeQueryString])

  useEffect(() => {
    const controls = globeRef.current?.controls?.()

    if (controls === undefined) {
      return
    }

    controls.autoRotate = idleMode
    controls.autoRotateSpeed = idleMode ? 0.45 : 0
    controls.enablePan = false
    controls.minDistance = 180
    controls.maxDistance = 420
  }, [idleMode, globeResponse])

  const presentation = useMemo(() => {
    if (globeResponse === null || geo.length === 0) {
      return null
    }

    return buildGlobePresentation(globeResponse.flows, geo)
  }, [geo, globeResponse])

  const selectedArc = presentation?.arcs.find((arc) => arc.donorId === selectedDonorId) ?? null
  const selectedPoint = presentation?.points.find((point) => point.iso3 === selectedCountryIso3) ?? null
  const compareMode = yearMode === 'compare'
  const overlayArc = hoveredArc ?? selectedArc
  const overlayPoint = hoveredPoint ?? selectedPoint

  return (
    <div ref={containerRef} className="globe-canvas h-full w-full">
      <div className="pointer-events-none absolute inset-x-8 top-28 z-10 flex justify-center">
        <div className="grid min-w-[18rem] gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/68 px-4 py-3 text-left text-white shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Visible funding</p>
            <p className="mt-1 text-xl font-semibold">
              {presentation === null ? 'Loading...' : formatUsdMillions(presentation.visibleFundingUsdM)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Live corridors</p>
            <p className="mt-1 text-xl font-semibold">
              {presentation?.arcs.length.toLocaleString('en-US') ?? '--'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Recipient nodes</p>
            <p className="mt-1 text-xl font-semibold">
              {presentation?.points.length.toLocaleString('en-US') ?? '--'}
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-10 left-10 z-10 max-w-sm rounded-[1.75rem] border border-white/10 bg-slate-950/72 px-5 py-4 text-white shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
        {overlayArc !== null ? (
          <>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Funding corridor</p>
            <h3 className="mt-2 text-xl font-semibold">{overlayArc.donorName}</h3>
            <p className="mt-1 text-sm text-slate-300">
              {overlayArc.donorCountry} to {overlayArc.recipientName}
            </p>
            <p className="mt-4 text-3xl font-semibold">{formatUsdMillions(overlayArc.amountUsdM)}</p>
            <p className="mt-2 text-sm text-slate-300">Click arc to open donor drilldown in the insight rail.</p>
          </>
        ) : overlayPoint !== null ? (
          <>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Recipient node</p>
            <h3 className="mt-2 text-xl font-semibold">{overlayPoint.name}</h3>
            <p className="mt-1 text-sm text-slate-300">{overlayPoint.iso3}</p>
            <p className="mt-4 text-3xl font-semibold">{formatUsdMillions(overlayPoint.totalUsdM)}</p>
            <p className="mt-2 text-sm text-slate-300">
              Supported by {overlayPoint.donorCount.toLocaleString('en-US')} donor
              {overlayPoint.donorCount === 1 ? '' : 's'}.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Live flow map</p>
            <h3 className="mt-2 text-xl font-semibold">Follow the strongest funding corridors</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Hover arcs for corridor context, click arcs for donor drilldowns, and click glow points to pivot into
              recipient-country analysis.
            </p>
          </>
        )}
      </div>

      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        backgroundImageUrl={STARFIELD_TEXTURE}
        globeImageUrl={EARTH_TEXTURE}
        showAtmosphere
        atmosphereColor="#7dd3fc"
        atmosphereAltitude={0.16}
        animateIn
        arcsData={presentation?.arcs ?? []}
        arcStartLat={(arc: GlobeArcDatum) => arc.donorLat}
        arcStartLng={(arc: GlobeArcDatum) => arc.donorLon}
        arcEndLat={(arc: GlobeArcDatum) => arc.recipientLat}
        arcEndLng={(arc: GlobeArcDatum) => arc.recipientLon}
        arcColor={(arc: GlobeArcDatum) => getArcColor(arc, compareMode)}
        arcAltitude={(arc: GlobeArcDatum) => Math.min(0.42, 0.08 + arc.amountUsdM / 2500)}
        arcStroke={(arc: GlobeArcDatum) => Math.min(1.8, 0.35 + arc.amountUsdM / 450)}
        arcDashLength={0.8}
        arcDashGap={0.35}
        arcDashAnimateTime={1600}
        arcLabel={(arc: GlobeArcDatum) => `${arc.donorName} -> ${arc.recipientName}: ${formatUsdMillions(arc.amountUsdM)}`}
        onArcHover={(arc: object | null) => setHoveredArc((arc as GlobeArcDatum | null) ?? null)}
        onArcClick={(arc: object) => {
          setIdleMode(false)
          selectDonor((arc as GlobeArcDatum).donorId)
        }}
        pointsData={presentation?.points ?? []}
        pointLat={(point: GlobePointDatum) => point.lat}
        pointLng={(point: GlobePointDatum) => point.lon}
        pointAltitude={(point: GlobePointDatum) => Math.min(0.28, 0.03 + point.totalUsdM / 2500)}
        pointRadius={(point: GlobePointDatum) => Math.min(0.65, 0.14 + point.totalUsdM / 1600)}
        pointColor={(point: GlobePointDatum) => getPointColor(point)}
        pointsMerge
        pointLabel={(point: GlobePointDatum) => `${point.name}: ${formatUsdMillions(point.totalUsdM)}`}
        onPointHover={(point: object | null) => setHoveredPoint((point as GlobePointDatum | null) ?? null)}
        onPointClick={(point: object) => {
          setIdleMode(false)
          selectCountry((point as GlobePointDatum).iso3)
        }}
      />
    </div>
  )
}

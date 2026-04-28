'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { createDashboardSearchParams } from '../../features/dashboard/queryState'
import { useDashboardState } from '../../features/dashboard/useDashboardState'
import type { GlobeResponse } from '../../contracts/globe'
import { DELTA_COLOR_RAMPS, getSectorArcColors } from '../../lib/colorScales'
import { COUNTRY_GEOJSON_URL, getCountryIso3, type CountryProperties } from '../../lib/globeSelection'
import type { GlobeArcDatum, GlobePointDatum } from './globePresentation'
import { GlobeLegend } from './GlobeLegend'

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

const EARTH_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-night.jpg'
const STARFIELD_TEXTURE = 'https://unpkg.com/three-globe/example/img/night-sky.png'

function normalizeCountryName(value: string | undefined) {
  return value?.trim().toLocaleLowerCase('en-US')
}

function formatUsdMillions(value: number) {
  return `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value >= 1000 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)}M`
}

function getCompareDelta(arc: GlobeArcDatum, compareFrom?: number, compareTo?: number) {
  if (compareFrom === undefined || compareTo === undefined) {
    return 0
  }

  const fromAmount = arc.yearAmounts.find((entry) => entry.year === compareFrom)?.totalUsdM ?? 0
  const toAmount = arc.yearAmounts.find((entry) => entry.year === compareTo)?.totalUsdM ?? 0

  return toAmount - fromAmount
}

function getArcColor(arc: GlobeArcDatum, compareMode: boolean, compareFrom?: number, compareTo?: number) {
  if (compareMode) {
    const delta = getCompareDelta(arc, compareFrom, compareTo)

    if (Math.abs(delta) < 0.05) {
      return [...DELTA_COLOR_RAMPS.neutral]
    }

    return delta > 0 ? [...DELTA_COLOR_RAMPS.positive] : [...DELTA_COLOR_RAMPS.negative]
  }

  return getSectorArcColors(arc.sector)
}

function getArcAltitude(arc: GlobeArcDatum) {
  const toRad = Math.PI / 180
  const lat1 = arc.donorLat * toRad
  const lat2 = arc.recipientLat * toRad
  const dLat = (arc.recipientLat - arc.donorLat) * toRad
  const dLon = (arc.recipientLon - arc.donorLon) * toRad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  const centralAngle = 2 * Math.asin(Math.min(1, Math.sqrt(a)))
  // Minimum altitude needed to keep the arc above the globe surface is
  // 1/cos(θ/2) - 1. Add a small buffer and cap for readability.
  const minAlt = 1 / Math.cos(centralAngle / 2) - 1
  return Math.min(0.55, Math.max(0.1, minAlt + 0.05))
}

function getPointColor(point: GlobePointDatum) {
  if (point.totalUsdM >= 500) {
    return '#a5f3fc'
  }

  if (point.totalUsdM >= 100) {
    return '#67e8f9'
  }

  return '#c4b5fd'
}

function getSquaredDistance(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const dLat = toLat - fromLat
  const dLng = toLng - fromLng
  return dLat * dLat + dLng * dLng
}

interface GlobeCountryFeature {
  type: 'Feature'
  properties?: CountryProperties & {
    name?: string
    admin?: string
  }
  geometry?: unknown
}

interface GlobeFiltersResponse {
  donorCountries?: string[]
}

export function GlobeScene() {
  const globeRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 1000, height: 820 })
  const [globeResponse, setGlobeResponse] = useState<GlobeResponse | null>(null)
  const [countryFeatures, setCountryFeatures] = useState<GlobeCountryFeature[]>([])
  const [donorCountryOptions, setDonorCountryOptions] = useState<string[]>([])
  const [globeError, setGlobeError] = useState<string | null>(null)
  const [hoveredArc, setHoveredArc] = useState<GlobeArcDatum | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<GlobePointDatum | null>(null)
  const [hoveredCountryIso3, setHoveredCountryIso3] = useState<string | null>(null)
  const idleMode = useDashboardState((state) => state.idleMode)
  const yearMode = useDashboardState((state) => state.yearMode)
  const year = useDashboardState((state) => state.year)
  const compareFrom = useDashboardState((state) => state.compareFrom)
  const compareTo = useDashboardState((state) => state.compareTo)
  const valueMode = useDashboardState((state) => state.valueMode)
  const donor = useDashboardState((state) => state.donor)
  const donorCountry = useDashboardState((state) => state.donorCountry)
  const recipientCountry = useDashboardState((state) => state.recipientCountry)
  const sector = useDashboardState((state) => state.sector)
  const selectedCountryIso3 = useDashboardState((state) => state.selectedCountryIso3)
  const selectedDonorId = useDashboardState((state) => state.selectedDonorId)
  const selectCountry = useDashboardState((state) => state.selectCountry)
  const selectDonor = useDashboardState((state) => state.selectDonor)
  const selectDonorCountry = useDashboardState((state) => state.selectDonorCountry)
  const setIdleMode = useDashboardState((state) => state.setIdleMode)
  const setGlobeStats = useDashboardState((state) => state.setGlobeStats)

  const selectionType = useDashboardState((state) => state.selectionType)
  const selectionId = useDashboardState((state) => state.selectionId)

  const globeQueryString = useMemo(
    () =>
      createDashboardSearchParams({
        yearMode,
        year,
        compareFrom,
        compareTo,
        valueMode,
        donor,
        donorCountry,
        recipientCountry,
        sector,
        marker: undefined,
        selectionType: undefined,
        selectionId: undefined,
      }).toString(),
    [compareFrom, compareTo, donor, donorCountry, recipientCountry, sector, valueMode, year, yearMode],
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
    const href = globeQueryString.length === 0 ? '/api/globe' : `/api/globe?${globeQueryString}`

    void fetch(href)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { message?: string } | null
          throw new Error(payload?.message ?? 'Globe data is unavailable.')
        }

        return response.json() as Promise<GlobeResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setGlobeResponse(data)
          setGlobeError(null)
          setGlobeStats({
            visibleFundingUsdM: data.visibleFundingUsdM,
            arcCount: data.arcs.length,
            pointCount: data.points.length,
            crossBorderPct: data.crossBorderPct,
            domesticPct: data.domesticPct,
          })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setGlobeResponse({ arcs: [], points: [], visibleFundingUsdM: 0, crossBorderPct: 0, domesticPct: 0 })
          setGlobeStats({
            visibleFundingUsdM: 0,
            arcCount: 0,
            pointCount: 0,
            crossBorderPct: 0,
            domesticPct: 0,
          })
          setGlobeError(error instanceof Error ? error.message : 'Globe data is unavailable.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [globeQueryString, setGlobeStats])

  useEffect(() => {
    let cancelled = false

    void fetch(COUNTRY_GEOJSON_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Country boundaries are unavailable.')
        }

        return response.json() as Promise<{ features?: GlobeCountryFeature[] }>
      })
      .then((data) => {
        if (!cancelled) {
          setCountryFeatures(data.features ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCountryFeatures([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void fetch('/api/filters')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Filter data is unavailable.')
        }

        return response.json() as Promise<GlobeFiltersResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setDonorCountryOptions(data.donorCountries ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDonorCountryOptions([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

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

  const visibleArcs = useMemo(() => {
    const arcs = globeResponse?.arcs ?? []
    if (selectionType === 'donor' && selectionId !== undefined) {
      const normalizedId = selectionId.replace(/_/g, '-')
      return arcs.filter((arc) => arc.donorId === normalizedId)
    }
    if (selectionType === 'country' && selectionId !== undefined) {
      return arcs.filter((arc) => arc.recipientIso3 === selectionId)
    }
    return arcs.slice(0, 300)
  }, [globeResponse, selectionId, selectionType])

  const donorCountryRecipientIsoSet = useMemo(() => {
    if (selectionType !== 'donorCountry') {
      return new Set<string>()
    }

    return new Set((globeResponse?.arcs ?? []).map((arc) => arc.recipientIso3))
  }, [globeResponse, selectionType])

  const donorCountryNameMap = useMemo(() => {
    return new Map(
      donorCountryOptions.map((countryName) => [normalizeCountryName(countryName), countryName] as const),
    )
  }, [donorCountryOptions])

  const selectedArc = visibleArcs.find((arc) => arc.donorId === selectedDonorId) ?? null
  const selectedPoint = globeResponse?.points.find((point) => point.iso3 === selectedCountryIso3) ?? null
  const compareMode = yearMode === 'compare'
  const overlayArc = hoveredArc ?? selectedArc
  const overlayPoint = hoveredPoint ?? selectedPoint
  const overlayDelta = overlayArc === null ? 0 : getCompareDelta(overlayArc, compareFrom, compareTo)

  return (
    <div ref={containerRef} className="globe-canvas h-full w-full">
      {globeError !== null ? (
        <div className="pointer-events-none absolute inset-x-4 top-36 z-10 flex justify-center">
          <div className="max-w-xl rounded-[1.5rem] border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            {globeError}
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-5 left-5 z-10 max-w-xs rounded-[1.5rem] border border-white/10 bg-slate-950/72 px-4 py-3 text-white shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        {overlayArc !== null ? (
          <>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Active flow</p>
            <h3 className="mt-2 text-lg font-semibold">{overlayArc.donorName}</h3>
            <p className="mt-1 text-sm text-slate-300">
              {overlayArc.sector}
            </p>
            <p className="mt-3 text-2xl font-semibold">{formatUsdMillions(overlayArc.amountUsdM)}</p>
            <p className="mt-2 text-sm text-slate-300">
              {compareMode
                ? `${overlayDelta > 0 ? 'Positive' : overlayDelta < 0 ? 'Negative' : 'Neutral'} delta of ${formatUsdMillions(Math.abs(overlayDelta))} across the selected years.`
                : `${overlayArc.sector} corridor. Click arc to open donor drilldown in the insight rail.`}
            </p>
          </>
        ) : overlayPoint !== null ? (
          <>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Recipient node</p>
            <h3 className="mt-2 text-lg font-semibold">{overlayPoint.name}</h3>
            <p className="mt-1 text-sm text-slate-300">{overlayPoint.iso3}</p>
            <p className="mt-3 text-2xl font-semibold">{formatUsdMillions(overlayPoint.totalUsdM)}</p>
            <p className="mt-2 text-sm text-slate-300">
              Supported by {overlayPoint.donorCount.toLocaleString('en-US')} donor
              {overlayPoint.donorCount === 1 ? '' : 's'}.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Live flow map</p>
            <h3 className="mt-2 text-lg font-semibold">Follow the strongest funding corridors</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {compareMode
                ? 'Compare mode highlights funding deltas across two years. Hover corridors for context, then click arcs or recipient nodes to pivot into the insight rail.'
                : 'Hover arcs for corridor context, click arcs for donor drilldowns, and click glow points to pivot into recipient-country analysis.'}
            </p>
          </>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-5 right-5 z-10 w-[18rem] max-w-[calc(100%-2.5rem)]">
        <GlobeLegend compareMode={compareMode} />
      </div>

      <div style={{ transform: 'translateY(72px)' }}>
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
        polygonsData={countryFeatures}
        polygonAltitude={(feature: object) => {
          const iso3 = getCountryIso3((feature as GlobeCountryFeature).properties)
          if (iso3 !== undefined && donorCountryRecipientIsoSet.has(iso3)) {
            return hoveredCountryIso3 !== null && iso3 === hoveredCountryIso3 ? 0.005 : 0.0024
          }
          return hoveredCountryIso3 !== null && iso3 === hoveredCountryIso3 ? 0.004 : 0.001
        }}
        polygonCapColor={(feature: object) => {
          const iso3 = getCountryIso3((feature as GlobeCountryFeature).properties)
          if (iso3 !== undefined && donorCountryRecipientIsoSet.has(iso3)) {
            return hoveredCountryIso3 !== null && iso3 === hoveredCountryIso3
              ? 'rgba(251,191,36,0.12)'
              : 'rgba(251,191,36,0.05)'
          }
          return hoveredCountryIso3 !== null && iso3 === hoveredCountryIso3
            ? 'rgba(34,211,238,0.08)'
            : 'rgba(255,255,255,0.01)'
        }}
        polygonSideColor={() => 'rgba(255,255,255,0.02)'}
        polygonStrokeColor={(feature: object) => {
          const iso3 = getCountryIso3((feature as GlobeCountryFeature).properties)
          if (iso3 !== undefined && donorCountryRecipientIsoSet.has(iso3)) {
            return hoveredCountryIso3 !== null && iso3 === hoveredCountryIso3
              ? 'rgba(251,191,36,0.74)'
              : 'rgba(251,191,36,0.58)'
          }
          return hoveredCountryIso3 !== null && iso3 === hoveredCountryIso3
            ? 'rgba(125,211,252,0.55)'
            : 'rgba(255,255,255,0.08)'
        }}
        polygonLabel={(feature: object) => {
          const country = feature as GlobeCountryFeature
          const iso3 = getCountryIso3(country.properties)
          const name = country.properties?.name ?? country.properties?.admin ?? iso3 ?? 'Country'
          return iso3 === undefined ? name : `${name} (${iso3})`
        }}
        onPolygonHover={(feature: object | null) => {
          setHoveredCountryIso3(getCountryIso3((feature as GlobeCountryFeature | null)?.properties) ?? null)
        }}
        onPolygonClick={(feature: object) => {
          const country = feature as GlobeCountryFeature
          const iso3 = getCountryIso3(country.properties)
          if (iso3 === undefined) {
            return
          }

          const clickedName = normalizeCountryName(country.properties?.name ?? country.properties?.admin)
          const matchedDonorCountry = globeResponse?.arcs.find((arc) => {
            return normalizeCountryName(arc.donorCountry) === clickedName
          })?.donorCountry
          const matchedKnownDonorCountry = clickedName === undefined ? undefined : donorCountryNameMap.get(clickedName)

          setIdleMode(false)
          if (
            selectionType === 'donorCountry'
            && !donorCountryRecipientIsoSet.has(iso3)
            && matchedKnownDonorCountry !== undefined
          ) {
            selectDonorCountry(matchedKnownDonorCountry)
            return
          }

          if (matchedDonorCountry !== undefined) {
            selectDonorCountry(matchedDonorCountry)
            return
          }

          selectCountry(iso3, country.properties?.name ?? country.properties?.admin ?? null)
        }}
        arcsData={visibleArcs}
        arcStartLat={(arc: GlobeArcDatum) => arc.donorLat}
        arcStartLng={(arc: GlobeArcDatum) => arc.donorLon}
        arcEndLat={(arc: GlobeArcDatum) => arc.recipientLat}
        arcEndLng={(arc: GlobeArcDatum) => arc.recipientLon}
        arcColor={(arc: GlobeArcDatum) => getArcColor(arc, compareMode, compareFrom, compareTo)}
        arcAltitude={(arc: GlobeArcDatum) => getArcAltitude(arc)}
        arcStroke={(arc: GlobeArcDatum) => Math.min(1.35, 0.28 + arc.amountUsdM / 900)}
        arcDashLength={0.8}
        arcDashGap={0.35}
        arcDashAnimateTime={1600}
        arcLabel={(arc: GlobeArcDatum) => `${arc.donorName} -> ${arc.recipientName}: ${formatUsdMillions(arc.amountUsdM)}`}
        onArcHover={(arc: object | null) => setHoveredArc((arc as GlobeArcDatum | null) ?? null)}
        onArcClick={(arc: object) => {
          setIdleMode(false)
          selectDonor((arc as GlobeArcDatum).donorId)
        }}
        pointsData={globeResponse?.points ?? []}
        pointLat={(point: GlobePointDatum) => point.lat}
        pointLng={(point: GlobePointDatum) => point.lon}
        pointAltitude={(point: GlobePointDatum) => Math.min(0.28, 0.03 + point.totalUsdM / 2500)}
        pointRadius={(point: GlobePointDatum) => Math.min(0.5, 0.12 + point.totalUsdM / 2400)}
        pointColor={(point: GlobePointDatum) => getPointColor(point)}
        pointsMerge
        pointLabel={(point: GlobePointDatum) => `${point.name}: ${formatUsdMillions(point.totalUsdM)}`}
        onPointHover={(point: object | null) => setHoveredPoint((point as GlobePointDatum | null) ?? null)}
        onPointClick={(point: object) => {
          setIdleMode(false)
          selectCountry((point as GlobePointDatum).iso3, (point as GlobePointDatum).name)
        }}
        onGlobeClick={({ lat, lng }: { lat: number; lng: number }) => {
          const points = globeResponse?.points ?? []
          const donors = new Map<string, { donorId: string; donorLat: number; donorLon: number }>()

          for (const arc of globeResponse?.arcs ?? []) {
            if (!donors.has(arc.donorId)) {
              donors.set(arc.donorId, {
                donorId: arc.donorId,
                donorLat: arc.donorLat,
                donorLon: arc.donorLon,
              })
            }
          }

          let nearestPoint: GlobePointDatum | null = null
          let nearestPointDist = Infinity
          for (const point of points) {
            const dist = getSquaredDistance(lat, lng, point.lat, point.lon)
            if (dist < nearestPointDist) {
              nearestPointDist = dist
              nearestPoint = point
            }
          }

          let nearestDonor: { donorId: string; donorLat: number; donorLon: number } | null = null
          let nearestDonorDist = Infinity
          for (const donorOrigin of donors.values()) {
            const dist = getSquaredDistance(lat, lng, donorOrigin.donorLat, donorOrigin.donorLon)
            if (dist < nearestDonorDist) {
              nearestDonorDist = dist
              nearestDonor = donorOrigin
            }
          }

          const selectionThreshold = 100

          if (
            nearestDonor !== null
            && nearestDonorDist < selectionThreshold
            && nearestDonorDist <= nearestPointDist
          ) {
            setIdleMode(false)
            selectDonor(nearestDonor.donorId)
            return
          }

          if (nearestPoint !== null && nearestPointDist < selectionThreshold) {
            setIdleMode(false)
            selectCountry(nearestPoint.iso3, nearestPoint.name)
          }
        }}
      />
      </div>
    </div>
  )
}

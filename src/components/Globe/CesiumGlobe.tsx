import { useRef, useEffect, useState } from 'react'
import { Viewer } from 'resium'
import { ArcGisMapServerImageryProvider, ImageryLayer, Color, ScreenSpaceEventHandler, ScreenSpaceEventType, GeoJsonDataSource } from 'cesium'
import type { AppData } from '../../types'
import { ArcLayer } from './ArcLayer'
import { CrisisAnnotations } from './CrisisAnnotations'
import { useStore } from '../../state/store'
import {
  COUNTRY_GEOJSON_LOAD_OPTIONS,
  COUNTRY_GEOJSON_URL,
  DISABLED_GLOBE_SCREEN_SPACE_EVENTS,
  getCountryIso3,
  getPickedCountryEntity,
  resolveGlobeSelection,
} from '../../lib/globeSelection'

interface Props { data: AppData }

interface TooltipState {
  x: number
  y: number
  donor: string
  recipient: string
  usd: string
  sector: string
  year: number
}

export function CesiumGlobe({ data }: Props) {
  const viewerRef = useRef<any>(null)
  const countriesDataSourceRef = useRef<GeoJsonDataSource | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data
  const { setSelectedDonorId, setSelectedCountryIso3, setDonorCountry } = useStore()
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return
    viewer.useBrowserRecommendedResolution = false
    viewer.resolutionScale = window.devicePixelRatio

    ArcGisMapServerImageryProvider.fromUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    ).then((provider) => {
      viewer.imageryLayers.removeAll()
      viewer.imageryLayers.add(new ImageryLayer(provider))
    })

    viewer.scene.skyAtmosphere.show = true
    viewer.scene.globe.enableLighting = true
    viewer.scene.fog.enabled = true
    viewer.scene.fog.density = 0.0002
    viewer.scene.skyAtmosphere.atmosphereLightIntensity = 10.0
    viewer.scene.globe.showGroundAtmosphere = true
    viewer.scene.globe.atmosphereLightIntensity = 10.0
    viewer.scene.globe.baseColor = Color.fromCssColorString('#0a1628')

    GeoJsonDataSource.load(COUNTRY_GEOJSON_URL, COUNTRY_GEOJSON_LOAD_OPTIONS).then((ds) => {
      viewer.dataSources.add(ds)
      countriesDataSourceRef.current = ds
    })

    for (const eventType of DISABLED_GLOBE_SCREEN_SPACE_EVENTS) {
      viewer.screenSpaceEventHandler.removeInputAction(eventType)
    }

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction((movement: { endPosition: { x: number; y: number } }) => {
      const picked = viewer.scene.pick(movement.endPosition)
      if (picked?.id?.name?.startsWith('FLOW~')) {
        const parts = picked.id.name.split('~')
        setTooltip({
          x: movement.endPosition.x,
          y: movement.endPosition.y,
          donor: parts[1],
          recipient: parts[2],
          usd: parts[3],
          sector: parts[4],
          year: Number(parts[5]),
        })
      } else {
        setTooltip(null)
      }
    }, ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction((movement: { position: { x: number; y: number } }) => {
      // drillPick goes through all objects at cursor — arcs sit above country polygons
      // so pick() would return the arc; drillPick lets us find the country underneath
      const hits = viewer.scene.drillPick(movement.position)
      const countryEntity = getPickedCountryEntity(
        hits,
        (entity) => Boolean(entity && countriesDataSourceRef.current?.entities.contains(entity as any)),
      )
      if (!countryEntity) {
        setSelectedDonorId(null)
        setDonorCountry(null)
        setSelectedCountryIso3(null)
        return
      }
      const iso3 = getCountryIso3(countryEntity.properties)
      if (iso3) {
        const nextSelection = resolveGlobeSelection(iso3, dataRef.current.donors)
        setDonorCountry(nextSelection.donorCountry)
        setSelectedDonorId(nextSelection.selectedDonorId)
        setSelectedCountryIso3(nextSelection.selectedCountryIso3)
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    const canvas = viewer.scene.canvas
    const onMouseLeave = () => { setTooltip(null) }
    canvas.addEventListener('mouseleave', onMouseLeave)

    return () => {
      handler.destroy()
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <Viewer
        ref={viewerRef}
        full
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        geocoder={false}
        infoBox={false}
        selectionIndicator={false}
      >
        <ArcLayer data={data} />
        <CrisisAnnotations events={data.crisisEvents} geo={data.geo} />
      </Viewer>
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <div className="bg-gray-900/95 border border-gray-600/60 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm text-xs min-w-[160px]">
            <div className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">{tooltip.sector} · {tooltip.year}</div>
            <div className="text-white font-semibold truncate max-w-[200px]">{tooltip.donor}</div>
            <div className="text-gray-400 text-[11px]">→ {tooltip.recipient}</div>
            <div className="text-blue-400 font-bold mt-1">${tooltip.usd}M</div>
          </div>
        </div>
      )}
    </div>
  )
}

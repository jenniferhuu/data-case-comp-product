import { useRef, useEffect, useState } from 'react'
import { Viewer } from 'resium'
import { TileMapServiceImageryProvider, ImageryLayer, buildModuleUrl, Color, ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium'
import type { AppData } from '../../types'
import { ArcLayer } from './ArcLayer'
import { CrisisAnnotations } from './CrisisAnnotations'
import { useStore } from '../../state/store'

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
  const { setSelectedDonorId, setSelectedCountryIso3 } = useStore()
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return
    // Replace default Ion imagery with bundled Natural Earth II (no Ion token needed)
    TileMapServiceImageryProvider.fromUrl(
      buildModuleUrl('Assets/Textures/NaturalEarthII')
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
        onClick={(movement: any) => {
          const viewer = viewerRef.current?.cesiumElement
          if (!viewer) return
          const picked = viewer.scene.pick(movement.position)
          if (!picked) {
            setSelectedDonorId(null)
            setSelectedCountryIso3(null)
          }
        }}
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

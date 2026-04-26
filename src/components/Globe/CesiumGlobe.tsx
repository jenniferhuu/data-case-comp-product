import { useRef } from 'react'
import { Viewer } from 'resium'
import { Ion } from 'cesium'
import type { AppData } from '../../types'
import { ArcLayer } from './ArcLayer'
import { CrisisAnnotations } from './CrisisAnnotations'
import { useStore } from '../../state/store'

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN ?? ''

interface Props { data: AppData }

export function CesiumGlobe({ data }: Props) {
  const viewerRef = useRef<any>(null)
  const { setSelectedDonorId, setSelectedCountryIso3 } = useStore()

  return (
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
  )
}

import { useState } from 'react'
import { Entity, BillboardGraphics, LabelGraphics } from 'resium'
import { Cartesian3, Color, VerticalOrigin } from 'cesium'
import type { CrisisEvent, Country } from '../../types'
import { useStore } from '../../state/store'

interface Props {
  events: CrisisEvent[]
  geo: Country[]
}

export function CrisisAnnotations({ events, geo }: Props) {
  const { yearSelection } = useStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const geoMap = new Map(geo.map(c => [c.iso3, c]))

  const visible = events.filter((e) => {
    if (yearSelection === 'all') return true
    if (yearSelection === 'compare') return true
    return e.year === yearSelection
  })

  return (
    <>
      {visible.map((event) => {
        const lat = event.lat ?? geoMap.get(event.country_iso3 ?? '')?.lat ?? 0
        const lon = event.lon ?? geoMap.get(event.country_iso3 ?? '')?.lon ?? 0
        const position = Cartesian3.fromDegrees(lon, lat, 50_000)
        const isExpanded = expandedId === event.id

        return (
          <Entity
            key={event.id}
            position={position}
            onClick={() => setExpandedId(isExpanded ? null : event.id)}
          >
            <BillboardGraphics
              image={createPinDataUrl(event.highlight_color)}
              verticalOrigin={VerticalOrigin.BOTTOM}
              scale={0.6}
            />
            {isExpanded && (
              <LabelGraphics
                text={`${event.name}\n${event.year}\n${event.description}`}
                fillColor={Color.WHITE}
                backgroundColor={Color.fromCssColorString('#1f2937').withAlpha(0.9)}
                showBackground
                scale={0.5}
                verticalOrigin={VerticalOrigin.BOTTOM}
                pixelOffset={new Cartesian3(0, -60, 0) as unknown as Cartesian3}
              />
            )}
          </Entity>
        )
      })}
    </>
  )
}

function createPinDataUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.9"/>
    <line x1="12" y1="22" x2="12" y2="36" stroke="${color}" stroke-width="2"/>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

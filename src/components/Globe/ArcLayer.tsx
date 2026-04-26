import { ColorMaterialProperty, ArcType, Color as CesiumColor } from 'cesium'
import { Entity, PolylineGraphics } from 'resium'
import { useStore } from '../../state/store'
import type { AppData, Flow } from '../../types'
import { applyFilters } from '../../lib/filters'
import { generateArcPoints } from '../../lib/arcGeometry'
import { sectorColor, growthRateColor, credibilityColor, arcWidth } from '../../lib/colorScales'

interface Props { data: AppData }

function getCompareColor(
  flow: Flow,
  allFlows: Flow[],
  compareYears: [number, number]
): CesiumColor {
  const [y1, y2] = compareYears
  const key = `${flow.donor_id}|${flow.recipient_iso3}`
  const inY1 = allFlows.some(f => f.year === y1 && `${f.donor_id}|${f.recipient_iso3}` === key)
  const inY2 = allFlows.some(f => f.year === y2 && `${f.donor_id}|${f.recipient_iso3}` === key)

  if (flow.year === y2 && !inY1) return CesiumColor.fromCssColorString('#22c55e').withAlpha(0.8)
  if (flow.year === y1 && !inY2) return CesiumColor.fromCssColorString('#ef4444').withAlpha(0.8)
  return CesiumColor.fromCssColorString('#9ca3af').withAlpha(0.5)
}

export function ArcLayer({ data }: Props) {
  const { mode, yearSelection, compareYears, donorCountry, sector, flowSizeMin, selectedMarker, setSelectedDonorId } = useStore()

  const geoByIso3 = new Map(data.geo.map(c => [c.iso3, c]))
  const donorIso3Map = new Map(data.donors.map(d => [d.donor_id, d.donor_iso3]))
  const markerMap = new Map(data.markers.map(m => [m.donor_id, m]))

  const filtered = applyFilters(data.flows.flows, {
    yearSelection, compareYears, donorCountry, sector, flowSizeMin,
  })

  return (
    <>
      {filtered.map((flow, i) => {
        const fromGeo = geoByIso3.get(donorIso3Map.get(flow.donor_id) ?? '')
        const toGeo = geoByIso3.get(flow.recipient_iso3)
        if (!fromGeo || !toGeo) return null

        const points = generateArcPoints(fromGeo.lat, fromGeo.lon, toGeo.lat, toGeo.lon)
        const width = arcWidth(flow.usd_disbursed_m)

        let color: CesiumColor
        if (mode === 'credibility') {
          const markerData = markerMap.get(flow.donor_id)
          const score = markerData?.markers[selectedMarker]?.credibility_score ?? 0
          color = credibilityColor(score)
        } else if (yearSelection === 'compare') {
          color = getCompareColor(flow, data.flows.flows, compareYears)
        } else if (yearSelection === 'all') {
          color = growthRateColor(flow.growth_rate)
        } else {
          color = sectorColor(flow.top_sector)
        }

        return (
          <Entity
            key={`${flow.donor_id}-${flow.recipient_iso3}-${flow.year}-${i}`}
            onClick={() => setSelectedDonorId(flow.donor_id)}
          >
            <PolylineGraphics
              positions={points}
              width={width}
              material={new ColorMaterialProperty(color)}
              arcType={ArcType.NONE}
            />
          </Entity>
        )
      })}
    </>
  )
}

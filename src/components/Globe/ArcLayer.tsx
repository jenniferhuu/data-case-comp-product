import { ArcType, Color as CesiumColor } from 'cesium'
import { AnimatedDashMaterialProperty } from '../../lib/animatedDashMaterial'
import { Entity, PolylineGraphics } from 'resium'
import { useStore } from '../../state/store'
import type { AppData, Flow } from '../../types'
import { generateArcPoints } from '../../lib/arcGeometry'
import { sectorColor, growthRateColor, credibilityColor, arcWidth } from '../../lib/colorScales'
import { getFilteredFlows } from '../../features/filters/derivedData'
import { useStoreFilterSnapshot } from '../../features/filters/storeFilters'

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
  const { mode, yearSelection, compareYears, selectedMarker } = useStore()
  const filters = useStoreFilterSnapshot()

  const geoByIso3 = new Map(data.geo.map(c => [c.iso3, c]))
  const donorIso3Map = new Map(data.donors.map(d => [d.donor_id, d.donor_iso3]))
  const markerMap = new Map(data.markers.map(m => [m.donor_id, m]))
  const filtered = getFilteredFlows(data.flows.flows, filters)

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
          // Preserve compare-mode semantics: added/removed state is based on
          // the full year-pair dataset, not the currently visible filtered subset.
          color = getCompareColor(flow, data.flows.flows, compareYears)
        } else if (yearSelection === 'all') {
          color = growthRateColor(flow.growth_rate)
        } else {
          color = sectorColor(flow.top_sector)
        }

        const displayColor = color.withAlpha(Math.min(color.alpha, 0.65))

        return (
          <Entity
            key={`${flow.donor_id}-${flow.recipient_iso3}-${flow.year}-${i}`}
            name={`FLOW~${flow.donor_name}~${flow.recipient_name}~${flow.usd_disbursed_m.toFixed(1)}~${flow.top_sector}~${flow.year}`}
          >
            <PolylineGraphics
              positions={points}
              width={width}
              material={new AnimatedDashMaterialProperty(displayColor)}
              arcType={ArcType.NONE}
            />
          </Entity>
        )
      })}
    </>
  )
}

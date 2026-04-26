import { ColorMaterialProperty, ArcType } from 'cesium'
import { Entity, PolylineGraphics } from 'resium'
import { useStore } from '../../state/store'
import type { AppData } from '../../types'
import { applyFilters } from '../../lib/filters'
import { generateArcPoints } from '../../lib/arcGeometry'
import { sectorColor, growthRateColor, credibilityColor, arcWidth } from '../../lib/colorScales'

interface Props { data: AppData }

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

        let color
        if (mode === 'credibility') {
          const markerData = markerMap.get(flow.donor_id)
          const score = markerData?.markers[selectedMarker]?.credibility_score ?? 0
          color = credibilityColor(score)
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

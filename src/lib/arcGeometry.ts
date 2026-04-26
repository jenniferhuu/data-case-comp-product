import { Cartesian3 } from 'cesium'

// Generate N interpolated points along a bezier arc between two lat/lon points.
// The midpoint is elevated to create a curved arc over the globe surface.
export function generateArcPoints(
  fromLat: number, fromLon: number,
  toLat: number,   toLon: number,
  numPoints = 64
): Cartesian3[] {
  const start = Cartesian3.fromDegrees(fromLon, fromLat)
  const end   = Cartesian3.fromDegrees(toLon,   toLat)

  // Midpoint on surface
  const midLat = (fromLat + toLat) / 2
  const midLon = (fromLon + toLon) / 2

  // Elevation proportional to arc length (great-circle distance in degrees)
  const distDeg = Math.sqrt((toLat - fromLat) ** 2 + (toLon - fromLon) ** 2)
  const heightM = Math.min(3_000_000, distDeg * 60_000)

  const mid = Cartesian3.fromDegrees(midLon, midLat, heightM)

  const points: Cartesian3[] = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    // Quadratic bezier: (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
    const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * mid.x + t ** 2 * end.x
    const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * mid.y + t ** 2 * end.y
    const z = (1 - t) ** 2 * start.z + 2 * (1 - t) * t * mid.z + t ** 2 * end.z
    points.push(new Cartesian3(x, y, z))
  }
  return points
}

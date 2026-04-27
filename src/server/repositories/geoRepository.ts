import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { GeoCountry } from '../../components/Globe/globePresentation'

let geoCache: GeoCountry[] | undefined

export async function readCountriesGeoJson(): Promise<GeoCountry[]> {
  if (geoCache !== undefined) {
    return geoCache
  }

  const content = await readFile(join(process.cwd(), 'public', 'data', 'countries_geo.json'), 'utf8')
  geoCache = JSON.parse(content) as GeoCountry[]

  return geoCache
}

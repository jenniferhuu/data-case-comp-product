import type { GlobeArtifact } from '../../contracts/globe'

export interface GeoCountry {
  iso3: string
  name: string
  lat: number
  lon: number
  continent: string
}

export interface GlobeArcDatum {
  donorId: string
  donorName: string
  donorCountry: string
  donorLat: number
  donorLon: number
  recipientIso3: string
  recipientName: string
  recipientLat: number
  recipientLon: number
  amountUsdM: number
  years: number[]
  sector: string
}

export interface GlobePointDatum {
  iso3: string
  name: string
  lat: number
  lon: number
  totalUsdM: number
  donorCount: number
}

export interface GlobePresentation {
  arcs: GlobeArcDatum[]
  points: GlobePointDatum[]
  visibleFundingUsdM: number
}

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  turkey: 'tur',
  turkiye: 'tur',
  'china peoples republic of': 'chn',
  'china people s republic of': 'chn',
  china: 'chn',
  luxembourg: 'lux',
  tanzania: 'tza',
  'democratic republic of the congo': 'cod',
  'moldova': 'mda',
  'dominican republic': 'dom',
  'costa rica': 'cri',
  'west bank and gaza strip': 'pse',
  'united states of america': 'usa',
  usa: 'usa',
  uk: 'gbr',
  'united kingdom of great britain and northern ireland': 'gbr',
}

const SYNTHETIC_GEO: GeoCountry[] = [
  { iso3: 'LUX', name: 'Luxembourg', lat: 49.82, lon: 6.13, continent: 'Europe' },
  { iso3: 'DOM', name: 'Dominican Republic', lat: 18.74, lon: -70.16, continent: 'Americas' },
  { iso3: 'CRI', name: 'Costa Rica', lat: 9.93, lon: -84.08, continent: 'Americas' },
  { iso3: 'BIL', name: 'Bilateral, unspecified', lat: 7.5, lon: 5, continent: 'Global' },
  { iso3: 'GLB', name: 'GLOBAL or unspecified', lat: 12, lon: 12, continent: 'Global' },
  { iso3: 'RAF', name: 'Africa, regional', lat: 2, lon: 20, continent: 'Africa' },
  { iso3: 'SSA', name: 'South of Sahara, regional', lat: -2, lon: 20, continent: 'Africa' },
  { iso3: 'ASI', name: 'Asia, regional', lat: 31, lon: 94, continent: 'Asia' },
  { iso3: 'SAM', name: 'South America, regional', lat: -16, lon: -60, continent: 'Americas' },
  { iso3: 'AME', name: 'America, regional', lat: 15, lon: -83, continent: 'Americas' },
  { iso3: 'SCA', name: 'South & Central Asia, regional', lat: 25, lon: 77, continent: 'Asia' },
  { iso3: 'EUR', name: 'Europe, regional', lat: 53, lon: 15, continent: 'Europe' },
  { iso3: 'FEA', name: 'Far East Asia, regional', lat: 35, lon: 116, continent: 'Asia' },
  { iso3: 'CAM', name: 'Central America, regional', lat: 15, lon: -89, continent: 'Americas' },
  { iso3: 'MID', name: 'Middle East, regional', lat: 28, lon: 44, continent: 'Asia' },
  { iso3: 'EAF', name: 'Eastern Africa, regional', lat: 0, lon: 37, continent: 'Africa' },
  { iso3: 'WAF', name: 'Western Africa, regional', lat: 10, lon: -3, continent: 'Africa' },
  { iso3: 'NSA', name: 'North of Sahara, regional', lat: 28, lon: 13, continent: 'Africa' },
  { iso3: 'CCA', name: 'Caribbean & Central America, regional', lat: 18, lon: -74, continent: 'Americas' },
  { iso3: 'SAS', name: 'South Asia, regional', lat: 21, lon: 79, continent: 'Asia' },
  { iso3: 'SAF', name: 'Southern Africa, regional', lat: -23, lon: 25, continent: 'Africa' },
  { iso3: 'CAS', name: 'Central Asia, regional', lat: 41, lon: 66, continent: 'Asia' },
  { iso3: 'MRX', name: 'Multi-country allocation', lat: 14, lon: 10, continent: 'Global' },
]

function normalizeCountryKey(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

function buildGeoIndex(geo: GeoCountry[]) {
  const byIso3 = new Map<string, GeoCountry>()
  const byName = new Map<string, GeoCountry>()

  for (const country of [...geo, ...SYNTHETIC_GEO]) {
    byIso3.set(country.iso3.toUpperCase(), country)
    byName.set(normalizeCountryKey(country.name), country)
  }

  return { byIso3, byName }
}

function resolveCountryGeo(value: string, index: ReturnType<typeof buildGeoIndex>) {
  const normalized = normalizeCountryKey(value)

  if (value.includes(';')) {
    return index.byIso3.get('MRX')
  }

  const aliasIso3 = COUNTRY_NAME_ALIASES[normalized]

  if (aliasIso3 !== undefined) {
    return index.byIso3.get(aliasIso3.toUpperCase())
  }

  return index.byName.get(normalized) ?? index.byIso3.get(value.toUpperCase())
}

export function buildGlobePresentation(flows: GlobeArtifact['flows'], geo: GeoCountry[]): GlobePresentation {
  const geoIndex = buildGeoIndex(geo)
  const arcsByCorridor = new Map<string, GlobeArcDatum>()
  const pointsByIso3 = new Map<string, GlobePointDatum & { donorIds: Set<string> }>()

  for (const flow of flows) {
    const donorGeo = resolveCountryGeo(flow.donorCountry, geoIndex)
    const recipientGeo = geoIndex.byIso3.get(flow.recipientIso3.toUpperCase()) ?? resolveCountryGeo(flow.recipientName, geoIndex)

    if (donorGeo === undefined || recipientGeo === undefined) {
      continue
    }

    const corridorKey = `${flow.donorId}::${flow.recipientIso3}`
    const existingArc = arcsByCorridor.get(corridorKey)

    if (existingArc === undefined) {
      arcsByCorridor.set(corridorKey, {
        donorId: flow.donorId,
        donorName: flow.donorName,
        donorCountry: flow.donorCountry,
        donorLat: donorGeo.lat,
        donorLon: donorGeo.lon,
        recipientIso3: recipientGeo.iso3,
        recipientName: flow.recipientName,
        recipientLat: recipientGeo.lat,
        recipientLon: recipientGeo.lon,
        amountUsdM: flow.amountUsdM,
        years: [flow.year],
        sector: flow.sector,
      })
    } else {
      existingArc.amountUsdM += flow.amountUsdM
      if (!existingArc.years.includes(flow.year)) {
        existingArc.years.push(flow.year)
      }
    }

    const existingPoint = pointsByIso3.get(recipientGeo.iso3)

    if (existingPoint === undefined) {
      pointsByIso3.set(recipientGeo.iso3, {
        iso3: recipientGeo.iso3,
        name: flow.recipientName,
        lat: recipientGeo.lat,
        lon: recipientGeo.lon,
        totalUsdM: flow.amountUsdM,
        donorCount: 1,
        donorIds: new Set([flow.donorId]),
      })
    } else {
      existingPoint.totalUsdM += flow.amountUsdM
      existingPoint.donorIds.add(flow.donorId)
      existingPoint.donorCount = existingPoint.donorIds.size
    }
  }

  const arcs = [...arcsByCorridor.values()]
    .map((arc) => ({
      ...arc,
      amountUsdM: Number(arc.amountUsdM.toFixed(1)),
      years: [...arc.years].sort((left, right) => left - right),
    }))
    .sort((left, right) => right.amountUsdM - left.amountUsdM)
    .slice(0, 180)

  const points = [...pointsByIso3.values()]
    .map(({ donorIds: _donorIds, ...point }) => ({
      ...point,
      totalUsdM: Number(point.totalUsdM.toFixed(1)),
    }))
    .sort((left, right) => right.totalUsdM - left.totalUsdM)
    .slice(0, 120)

  return {
    arcs,
    points,
    visibleFundingUsdM: Number(arcs.reduce((sum, arc) => sum + arc.amountUsdM, 0).toFixed(1)),
  }
}

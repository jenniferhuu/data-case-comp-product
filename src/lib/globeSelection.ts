import { Color } from 'cesium'
import type { DonorSummary } from '../types'

export interface GlobeSelectionState {
  selectedDonorId: string | null
  donorCountry: string | null
  selectedCountryIso3: string | null
}

type PropertyValue = string | { getValue?: () => string | undefined } | undefined

export interface CountryProperties {
  [key: string]: PropertyValue
}

export interface CountryGeoJsonLoadOptions {
  stroke: Color
  fill: Color
  strokeWidth: number
  clampToGround: boolean
}

export const COUNTRY_GEOJSON_URL = '/data/countries.geojson'

export const COUNTRY_GEOJSON_LOAD_OPTIONS: CountryGeoJsonLoadOptions = {
  stroke: Color.fromCssColorString('#f87171').withAlpha(0.6),
  fill: Color.TRANSPARENT,
  strokeWidth: 1.5,
  clampToGround: true,
}

function readPropertyValue(value: PropertyValue): string | undefined {
  if (typeof value === 'string') return value
  return value?.getValue?.()
}

export function getCountryIso3(properties?: CountryProperties): string | undefined {
  if (!properties) return undefined

  return readPropertyValue(properties.ISO_A3)
    ?? readPropertyValue(properties.iso_a3)
    ?? readPropertyValue(properties['ISO3166-1-Alpha-3'])
    ?? readPropertyValue(properties.adm0_a3)
}

export function resolveGlobeSelection(
  clickedIso3: string | null | undefined,
  donorSummaries: Pick<DonorSummary, 'donor_id' | 'donor_country' | 'donor_iso3'>[],
): GlobeSelectionState {
  if (!clickedIso3) {
    return {
      selectedDonorId: null,
      donorCountry: null,
      selectedCountryIso3: null,
    }
  }

  const matchedDonor = donorSummaries.find((donor) => donor.donor_iso3 === clickedIso3)

  if (matchedDonor) {
    return {
      selectedDonorId: matchedDonor.donor_id,
      donorCountry: matchedDonor.donor_country,
      selectedCountryIso3: null,
    }
  }

  return {
    selectedDonorId: null,
    donorCountry: null,
    selectedCountryIso3: clickedIso3,
  }
}

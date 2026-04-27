import { Color, ScreenSpaceEventType } from 'cesium'
import type { DonorSummary } from '../types'

export interface GlobeSelectionState {
  selectedDonorId: string | null
  donorCountry: string | null
  selectedCountryIso3: string | null
}

type PropertyValue = string | { getValue?: () => string | undefined } | undefined
type PickedEntity = {
  properties?: CountryProperties
  [key: string]: unknown
} | undefined

interface DrillPickHit {
  id?: PickedEntity
  primitive?: {
    id?: PickedEntity
  }
  properties?: CountryProperties
  [key: string]: unknown
}

interface ScreenSpaceEventHandlerLike {
  removeInputAction?: (type: ScreenSpaceEventType) => void
}

interface ViewerInputActionsLike {
  screenSpaceEventHandler?: ScreenSpaceEventHandlerLike
  cesiumWidget?: {
    screenSpaceEventHandler?: ScreenSpaceEventHandlerLike
  }
}

interface ViewerEntityFocusLike {
  selectedEntity?: unknown
  trackedEntity?: unknown
}

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
  fill: Color.WHITE.withAlpha(0.01),
  strokeWidth: 1.5,
  clampToGround: true,
}

export const DISABLED_GLOBE_SCREEN_SPACE_EVENTS = [
  ScreenSpaceEventType.LEFT_CLICK,
  ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
]

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

export function getFlowRecipientIso3FromEntityName(name?: string): string | undefined {
  if (!name?.startsWith('FLOW~')) {
    return undefined
  }

  const parts = name.split('~')
  return parts[3]
}

export function disableDefaultViewerInputActions(viewer: ViewerInputActionsLike): void {
  const handlers = [
    viewer.screenSpaceEventHandler,
    viewer.cesiumWidget?.screenSpaceEventHandler,
  ]

  for (const handler of handlers) {
    for (const eventType of DISABLED_GLOBE_SCREEN_SPACE_EVENTS) {
      handler?.removeInputAction?.(eventType)
    }
  }
}

export function clearViewerEntityFocus(viewer: ViewerEntityFocusLike): void {
  viewer.selectedEntity = undefined
  viewer.trackedEntity = undefined
}

export function getPickedCountryEntity(
  hits: DrillPickHit[],
  containsEntity: (entity: PickedEntity) => boolean,
): PickedEntity {
  for (const hit of hits) {
    const candidates = [hit.id, hit.primitive?.id, hit]

    for (const entity of candidates) {
      if (!entity) {
        continue
      }

      if (containsEntity(entity) || getCountryIso3(entity.properties)) {
        return entity
      }
    }
  }

  return undefined
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

  return {
    selectedDonorId: null,
    donorCountry: matchedDonor?.donor_country ?? null,
    selectedCountryIso3: clickedIso3,
  }
}

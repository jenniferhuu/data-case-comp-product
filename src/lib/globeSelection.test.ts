import { describe, expect, it } from 'vitest'
import { Color, ScreenSpaceEventType } from 'cesium'
import {
  COUNTRY_GEOJSON_LOAD_OPTIONS,
  COUNTRY_GEOJSON_URL,
  clearViewerEntityFocus,
  DISABLED_GLOBE_SCREEN_SPACE_EVENTS,
  disableDefaultViewerInputActions,
  getFlowRecipientIso3FromEntityName,
  getPickedCountryEntity,
  getCountryIso3,
  resolveGlobeSelection,
} from './globeSelection'
import type { DonorSummary } from '../types'

const donors: Pick<DonorSummary, 'donor_id' | 'donor_country' | 'donor_iso3'>[] = [
  {
    donor_id: 'gates_foundation',
    donor_country: 'United States',
    donor_iso3: 'USA',
  },
  {
    donor_id: 'wellcome_trust',
    donor_country: 'United Kingdom',
    donor_iso3: 'GBR',
  },
]

describe('resolveGlobeSelection', () => {
  it('resolves a clicked donor ISO3 to a country selection and syncs the donor-country filter', () => {
    expect(resolveGlobeSelection('USA', donors)).toEqual({
      selectedDonorId: null,
      donorCountry: 'United States',
      selectedCountryIso3: 'USA',
    })
  })

  it('falls back to the clicked country when no donor summary matches', () => {
    expect(resolveGlobeSelection('KEN', donors)).toEqual({
      selectedDonorId: null,
      donorCountry: null,
      selectedCountryIso3: 'KEN',
    })
  })

  it('returns a cleared selection when nothing is clicked', () => {
    expect(resolveGlobeSelection(null, donors)).toEqual({
      selectedDonorId: null,
      donorCountry: null,
      selectedCountryIso3: null,
    })
  })
})

describe('COUNTRY_GEOJSON_LOAD_OPTIONS', () => {
  it('uses a nearly transparent fill so country interiors remain pickable', () => {
    expect(COUNTRY_GEOJSON_LOAD_OPTIONS.fill.equals(Color.TRANSPARENT)).toBe(false)
    expect(COUNTRY_GEOJSON_LOAD_OPTIONS.fill.alpha).toBeGreaterThan(0)
    expect(COUNTRY_GEOJSON_LOAD_OPTIONS.fill.alpha).toBeLessThanOrEqual(0.02)
    expect(COUNTRY_GEOJSON_LOAD_OPTIONS.clampToGround).toBe(true)
    expect(COUNTRY_GEOJSON_LOAD_OPTIONS.strokeWidth).toBe(1.5)
    expect(COUNTRY_GEOJSON_URL).toBe('/data/countries.geojson')
  })
})

describe('DISABLED_GLOBE_SCREEN_SPACE_EVENTS', () => {
  it('tracks the Cesium built-in actions that must be disabled for custom globe selection', () => {
    expect(DISABLED_GLOBE_SCREEN_SPACE_EVENTS).toContain(ScreenSpaceEventType.LEFT_CLICK)
    expect(DISABLED_GLOBE_SCREEN_SPACE_EVENTS).toContain(ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
  })
})

describe('disableDefaultViewerInputActions', () => {
  it('removes built-in click handlers from both viewer handler surfaces', () => {
    const removedFromViewer: ScreenSpaceEventType[] = []
    const removedFromWidget: ScreenSpaceEventType[] = []

    disableDefaultViewerInputActions({
      screenSpaceEventHandler: {
        removeInputAction: (type: ScreenSpaceEventType) => {
          removedFromViewer.push(type)
        },
      },
      cesiumWidget: {
        screenSpaceEventHandler: {
          removeInputAction: (type: ScreenSpaceEventType) => {
            removedFromWidget.push(type)
          },
        },
      },
    })

    expect(removedFromViewer).toEqual(DISABLED_GLOBE_SCREEN_SPACE_EVENTS)
    expect(removedFromWidget).toEqual(DISABLED_GLOBE_SCREEN_SPACE_EVENTS)
  })
})

describe('clearViewerEntityFocus', () => {
  it('clears selected and tracked entities after arc double-click interactions', () => {
    const viewer = {
      selectedEntity: { id: 'flow-entity' },
      trackedEntity: { id: 'flow-entity' },
    }

    clearViewerEntityFocus(viewer)

    expect(viewer.selectedEntity).toBeUndefined()
    expect(viewer.trackedEntity).toBeUndefined()
  })
})

describe('getCountryIso3', () => {
  it('supports the uppercase ISO_A3 property shape', () => {
    expect(getCountryIso3({ ISO_A3: { getValue: () => 'GBR' } })).toBe('GBR')
  })

  it('supports the lowercase iso_a3 property used by bundled world boundaries', () => {
    expect(getCountryIso3({ iso_a3: { getValue: () => 'GBR' } })).toBe('GBR')
  })

  it('supports the hyphenated ISO3166-1-Alpha-3 property used by geo-countries', () => {
    expect(getCountryIso3({ 'ISO3166-1-Alpha-3': { getValue: () => 'GBR' } })).toBe('GBR')
  })
})

describe('getFlowRecipientIso3FromEntityName', () => {
  it('extracts the recipient ISO3 from an encoded flow entity name', () => {
    expect(
      getFlowRecipientIso3FromEntityName('FLOW~Gates Foundation~Kenya~KEN~6093.4~Health~2023'),
    ).toBe('KEN')
  })

  it('returns undefined for names that are not encoded flow entities', () => {
    expect(getFlowRecipientIso3FromEntityName('Kenya')).toBeUndefined()
  })
})

describe('getPickedCountryEntity', () => {
  it('accepts a country entity exposed directly on the pick hit', () => {
    const entity = { id: 'country-1' }

    expect(
      getPickedCountryEntity(
        [{ id: entity }],
        (candidate) => candidate === entity,
      ),
    ).toBe(entity)
  })

  it('accepts a country entity exposed on primitive.id', () => {
    const entity = { id: 'country-2' }

    expect(
      getPickedCountryEntity(
        [{ primitive: { id: entity } }],
        (candidate) => candidate === entity,
      ),
    ).toBe(entity)
  })

  it('falls back to an entity with ISO properties even when membership checks miss it', () => {
    const entity = {
      properties: {
        iso_a3: { getValue: () => 'KEN' },
      },
    }

    expect(
      getPickedCountryEntity(
        [{ id: entity }],
        () => false,
      ),
    ).toBe(entity)
  })
})

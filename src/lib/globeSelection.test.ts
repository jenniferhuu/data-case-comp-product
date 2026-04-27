import { describe, expect, it } from 'vitest'
import { Color, ScreenSpaceEventType } from 'cesium'
import {
  COUNTRY_GEOJSON_LOAD_OPTIONS,
  COUNTRY_GEOJSON_URL,
  DISABLED_GLOBE_SCREEN_SPACE_EVENTS,
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
  it('resolves a clicked donor ISO3 to the matching donor summary', () => {
    expect(resolveGlobeSelection('USA', donors)).toEqual({
      selectedDonorId: 'gates_foundation',
      donorCountry: 'United States',
      selectedCountryIso3: null,
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
  it('disables Cesiums default double click camera action', () => {
    expect(DISABLED_GLOBE_SCREEN_SPACE_EVENTS).toContain(ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
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
})

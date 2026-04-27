# Globe Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add animated directional arc dashes, ArcGIS satellite imagery, sharper rendering, visible country borders, click-to-select-donor, and a min/max dual-range flow size filter.

**Architecture:** Changes are spread across the globe rendering layer (`CesiumGlobe.tsx`), arc rendering layer (`ArcLayer.tsx`), a new GPU material helper, global state (`store.ts`), filter logic (`filters.ts`), and the flow size slider UI component. Each task is independent except Task 7 (ArcLayer) which depends on Tasks 4, 5, and 6.

**Tech Stack:** React 18, TypeScript, Cesium 1.118, Resium, Zustand, rc-slider, Vitest

---

## File Map

| File | Change |
|------|--------|
| `src/components/Globe/CesiumGlobe.tsx` | ArcGIS texture, resolution scale, red border color, click-to-select-donor |
| `src/lib/animatedDashMaterial.ts` | **Create** — custom GPU-animated dash MaterialProperty |
| `src/components/Globe/ArcLayer.tsx` | Use AnimatedDashMaterialProperty, pass flowSizeMax to applyFilters |
| `src/state/store.ts` | Add `flowSizeMax` / `setFlowSizeMax` |
| `src/lib/filters.ts` | Add `flowSizeMax` check to `applyFilters` |
| `src/lib/filters.test.ts` | Add `flowSizeMax` filter tests |
| `src/components/Controls/FlowSizeSlider.tsx` | Replace with dual-range rc-slider |

---

## Task 1: Install rc-slider

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install rc-slider**

```bash
npm install rc-slider
```

Expected output: `added N packages` with no errors. `rc-slider` includes its own TypeScript types.

- [ ] **Step 2: Verify types are available**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors about `rc-slider`.

---

## Task 2: Globe Rendering Improvements

**Files:**
- Modify: `src/components/Globe/CesiumGlobe.tsx`

- [ ] **Step 1: Replace the full import line and useEffect in CesiumGlobe.tsx**

Replace the existing import line:
```ts
import { TileMapServiceImageryProvider, ImageryLayer, buildModuleUrl, Color, ScreenSpaceEventHandler, ScreenSpaceEventType, GeoJsonDataSource } from 'cesium'
```

With:
```ts
import { ArcGisMapServerImageryProvider, ImageryLayer, Color, ScreenSpaceEventHandler, ScreenSpaceEventType, GeoJsonDataSource } from 'cesium'
```

- [ ] **Step 2: Add countriesDataSourceRef and update useStore destructure**

In `CesiumGlobe`, add a ref just below `viewerRef`:
```ts
const countriesDataSourceRef = useRef<GeoJsonDataSource | null>(null)
```

Update the `useStore` destructure to also include `setDonorCountry`:
```ts
const { setSelectedDonorId, setSelectedCountryIso3, setDonorCountry } = useStore()
```

- [ ] **Step 3: Replace the useEffect body up through the GeoJSON load**

Replace this block (lines ~26–53 in the original):
```ts
TileMapServiceImageryProvider.fromUrl(
  buildModuleUrl('Assets/Textures/NaturalEarthII')
).then((provider) => {
  viewer.imageryLayers.removeAll()
  viewer.imageryLayers.add(new ImageryLayer(provider))
})
viewer.scene.skyAtmosphere.show = true
viewer.scene.globe.enableLighting = true
viewer.scene.fog.enabled = true
viewer.scene.fog.density = 0.0002
viewer.scene.skyAtmosphere.atmosphereLightIntensity = 10.0
viewer.scene.globe.showGroundAtmosphere = true
viewer.scene.globe.atmosphereLightIntensity = 10.0
viewer.scene.globe.baseColor = Color.fromCssColorString('#0a1628')

GeoJsonDataSource.load(
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
  {
    stroke: Color.WHITE.withAlpha(0.25),
    fill: Color.TRANSPARENT,
    strokeWidth: 0.8,
    clampToGround: true,
  }
).then((ds) => { viewer.dataSources.add(ds) })
```

With:
```ts
viewer.useBrowserRecommendedResolution = false
viewer.resolutionScale = window.devicePixelRatio

ArcGisMapServerImageryProvider.fromUrl(
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
).then((provider) => {
  viewer.imageryLayers.removeAll()
  viewer.imageryLayers.add(new ImageryLayer(provider))
})

viewer.scene.skyAtmosphere.show = true
viewer.scene.globe.enableLighting = true
viewer.scene.fog.enabled = true
viewer.scene.fog.density = 0.0002
viewer.scene.skyAtmosphere.atmosphereLightIntensity = 10.0
viewer.scene.globe.showGroundAtmosphere = true
viewer.scene.globe.atmosphereLightIntensity = 10.0
viewer.scene.globe.baseColor = Color.fromCssColorString('#0a1628')

GeoJsonDataSource.load(
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
  {
    stroke: Color.fromCssColorString('#f87171').withAlpha(0.6),
    fill: Color.TRANSPARENT,
    strokeWidth: 1.5,
    clampToGround: true,
  }
).then((ds) => {
  viewer.dataSources.add(ds)
  countriesDataSourceRef.current = ds
})
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep CesiumGlobe
```

Expected: no errors for `CesiumGlobe.tsx`.

---

## Task 3: Click Country to Select Donor

**Files:**
- Modify: `src/components/Globe/CesiumGlobe.tsx`

This task depends on Task 2 (countriesDataSourceRef and setDonorCountry already added).

- [ ] **Step 1: Replace the Viewer onClick handler**

Find the existing `onClick` on the `<Viewer>` component:
```tsx
onClick={(movement: any) => {
  const viewer = viewerRef.current?.cesiumElement
  if (!viewer) return
  const picked = viewer.scene.pick(movement.position)
  if (!picked) {
    setSelectedDonorId(null)
    setSelectedCountryIso3(null)
  }
}}
```

Replace with:
```tsx
onClick={(movement: any) => {
  const viewer = viewerRef.current?.cesiumElement
  if (!viewer) return
  const picked = viewer.scene.pick(movement.position)
  if (!picked) {
    setSelectedDonorId(null)
    setSelectedCountryIso3(null)
    return
  }
  const entity = picked.id
  if (
    entity &&
    countriesDataSourceRef.current &&
    countriesDataSourceRef.current.entities.contains(entity)
  ) {
    const iso3: string | undefined = entity.properties?.ISO_A3?.getValue()
    if (iso3) {
      const donor = data.donors.find((d) => d.donor_iso3 === iso3)
      if (donor) {
        setDonorCountry(donor.donor_country)
        setSelectedDonorId(donor.donor_id)
      } else {
        setSelectedCountryIso3(iso3)
      }
    }
  }
}}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep CesiumGlobe
```

Expected: no errors.

---

## Task 4: Create AnimatedDashMaterialProperty

**Files:**
- Create: `src/lib/animatedDashMaterial.ts`

- [ ] **Step 1: Create the file**

```ts
import { Color, Event, JulianDate, Material } from 'cesium'

const MATERIAL_TYPE = 'AnimatedDash'

function ensureRegistered() {
  const cache = (Material as any)._materialCache
  try {
  cache.addMaterial(MATERIAL_TYPE, {
    fabric: {
      type: MATERIAL_TYPE,
      uniforms: {
        color: Color.WHITE.clone(),
        speed: 0.006,
        dashLength: 0.08,
      },
      source: `
czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  float offset = mod(czm_frameNumber * speed, 1.0);
  float phase = fract((materialInput.s + offset) / dashLength);
  if (phase > 0.5) discard;
  material.diffuse = color.rgb;
  material.alpha = color.a;
  return material;
}`,
    },
    translucent: true,
  })
  } catch {
    // Already registered (HMR reload or duplicate import)
  }
}

export class AnimatedDashMaterialProperty {
  readonly isConstant = false
  readonly definitionChanged = new Event()
  private _color: Color

  constructor(color: Color) {
    this._color = color
    ensureRegistered()
  }

  getType(_time: JulianDate): string {
    return MATERIAL_TYPE
  }

  getValue(_time: JulianDate, result: Record<string, unknown> = {}): Record<string, unknown> {
    result.color = this._color
    result.speed = 0.006
    result.dashLength = 0.08
    return result
  }

  equals(other: unknown): boolean {
    return (
      other instanceof AnimatedDashMaterialProperty &&
      Color.equals(this._color, (other as AnimatedDashMaterialProperty)._color)
    )
  }
}
```

**How the GLSL works:**
- `czm_frameNumber` is a Cesium built-in float uniform that increments every rendered frame.
- `materialInput.s` is the 0→1 coordinate along the polyline (0 = donor, 1 = recipient).
- `offset` advances each frame, making dashes scroll toward the recipient.
- `phase > 0.5` discards the "gap" half of each dash period.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep animatedDash
```

Expected: no errors.

---

## Task 5: Add flowSizeMax to Store

**Files:**
- Modify: `src/state/store.ts`

- [ ] **Step 1: Add flowSizeMax and setFlowSizeMax to the AppState interface**

Find the `// Filters` section in `store.ts`:
```ts
  flowSizeMin: number
  setFlowSizeMin: (n: number) => void
```

Add after it:
```ts
  flowSizeMax: number | null
  setFlowSizeMax: (n: number | null) => void
```

- [ ] **Step 2: Add default value and action in the store**

Find:
```ts
  flowSizeMin: 1,
  setFlowSizeMin: (flowSizeMin) => set({ flowSizeMin }),
```

Add after it:
```ts
  flowSizeMax: null,
  setFlowSizeMax: (flowSizeMax) => set({ flowSizeMax }),
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep store
```

Expected: no errors.

---

## Task 6: Update filters.ts and Tests

**Files:**
- Modify: `src/lib/filters.ts`
- Modify: `src/lib/filters.test.ts`

- [ ] **Step 1: Write the failing tests first**

Add these two test cases inside the existing `describe('applyFilters', ...)` block in `filters.test.ts`, after the existing tests:

```ts
  it('filters by flowSizeMax', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: null, sector: null, flowSizeMin: 0, flowSizeMax: 3 })
    expect(result).toHaveLength(2)
    result.forEach(f => expect(f.usd_disbursed_m).toBeLessThanOrEqual(3))
  })

  it('applies no upper cap when flowSizeMax is null', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: null, sector: null, flowSizeMin: 0, flowSizeMax: null })
    expect(result).toHaveLength(3)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/filters.test.ts 2>&1 | tail -20
```

Expected: 2 new tests fail with type errors (flowSizeMax not yet in FilterParams).

- [ ] **Step 3: Add flowSizeMax to FilterParams and applyFilters**

In `filters.ts`, update `FilterParams`:
```ts
export interface FilterParams {
  yearSelection: number | 'all' | 'compare'
  donorCountry: string | null
  sector: string | null
  flowSizeMin: number
  flowSizeMax?: number | null
  compareYears?: [number, number]
}
```

In `applyFilters`, add the max check after the existing `flowSizeMin` check:
```ts
if (f.usd_disbursed_m < params.flowSizeMin) return false
if (params.flowSizeMax != null && f.usd_disbursed_m > params.flowSizeMax) return false
```

- [ ] **Step 4: Run tests to verify they all pass**

```bash
npx vitest run src/lib/filters.test.ts 2>&1 | tail -20
```

Expected: all 8 tests pass.

---

## Task 7: Update ArcLayer

**Files:**
- Modify: `src/components/Globe/ArcLayer.tsx`

This task depends on Tasks 4, 5, and 6 being complete.

- [ ] **Step 1: Add imports for AnimatedDashMaterialProperty and flowSizeMax**

Replace the existing import line for `PolylineGlowMaterialProperty`:
```ts
import { PolylineGlowMaterialProperty, ArcType, Color as CesiumColor } from 'cesium'
```

With:
```ts
import { ArcType, Color as CesiumColor } from 'cesium'
import { AnimatedDashMaterialProperty } from '../../lib/animatedDashMaterial'
```

- [ ] **Step 2: Destructure flowSizeMax from the store**

Find:
```ts
const { mode, yearSelection, compareYears, donorCountry, sector, flowSizeMin, selectedMarker, setSelectedDonorId } = useStore()
```

Replace with:
```ts
const { mode, yearSelection, compareYears, donorCountry, sector, flowSizeMin, flowSizeMax, selectedMarker, setSelectedDonorId } = useStore()
```

- [ ] **Step 3: Pass flowSizeMax to applyFilters**

Find:
```ts
const filtered = applyFilters(data.flows.flows, {
  yearSelection, compareYears, donorCountry, sector, flowSizeMin,
})
```

Replace with:
```ts
const filtered = applyFilters(data.flows.flows, {
  yearSelection, compareYears, donorCountry, sector, flowSizeMin, flowSizeMax,
})
```

- [ ] **Step 4: Replace PolylineGlowMaterialProperty with AnimatedDashMaterialProperty**

Find:
```ts
material={new PolylineGlowMaterialProperty({ color: displayColor, glowPower: 0.25, taperPower: 0.7 })}
```

Replace with:
```ts
material={new AnimatedDashMaterialProperty(displayColor)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep ArcLayer
```

Expected: no errors.

---

## Task 8: Replace FlowSizeSlider with Dual-Range

**Files:**
- Modify: `src/components/Controls/FlowSizeSlider.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import { useState } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useStore } from '../../state/store'

const STEPS = [0.01, 0.1, 0.5, 1, 2, 5, 10, 25, 50]
const MAX_IDX = STEPS.length - 1

// idx 0 = no minimum (flowSizeMin = 0)
// idx MAX_IDX = no maximum (flowSizeMax = null)
function idxToMin(idx: number): number {
  return idx === 0 ? 0 : STEPS[idx]
}
function idxToMax(idx: number): number | null {
  return idx === MAX_IDX ? null : STEPS[idx]
}
function minToIdx(min: number): number {
  if (min === 0) return 0
  const i = STEPS.findIndex((s) => s >= min)
  return i < 0 ? MAX_IDX : i
}
function maxToIdx(max: number | null): number {
  if (max === null) return MAX_IDX
  const i = STEPS.findIndex((s) => s >= max)
  return i < 0 ? MAX_IDX : i
}

export function FlowSizeSlider() {
  const { flowSizeMin, setFlowSizeMin, flowSizeMax, setFlowSizeMax } = useStore()

  const [minInput, setMinInput] = useState(flowSizeMin === 0 ? '0' : String(flowSizeMin))
  const [maxInput, setMaxInput] = useState(flowSizeMax === null ? '∞' : String(flowSizeMax))

  const handleSliderChange = (value: number | number[]) => {
    const [lo, hi] = value as number[]
    const newMin = idxToMin(lo)
    const newMax = idxToMax(hi)
    setFlowSizeMin(newMin)
    setFlowSizeMax(newMax)
    setMinInput(newMin === 0 ? '0' : String(newMin))
    setMaxInput(newMax === null ? '∞' : String(newMax))
  }

  const commitMin = () => {
    if (minInput === '0' || minInput === '') {
      setFlowSizeMin(0)
      return
    }
    const v = parseFloat(minInput)
    if (!isNaN(v) && v >= 0) {
      setFlowSizeMin(v)
    } else {
      setMinInput(flowSizeMin === 0 ? '0' : String(flowSizeMin))
    }
  }

  const commitMax = () => {
    if (maxInput === '∞' || maxInput === '') {
      setFlowSizeMax(null)
      return
    }
    const v = parseFloat(maxInput)
    if (!isNaN(v) && v > 0) {
      setFlowSizeMax(v)
    } else {
      setMaxInput(flowSizeMax === null ? '∞' : String(flowSizeMax))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400 uppercase tracking-wide">Flow size ($M)</label>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-gray-500">$</span>
          <input
            type="text"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            onBlur={commitMin}
            onKeyDown={(e) => e.key === 'Enter' && commitMin()}
            className="w-12 text-xs bg-gray-800 border border-gray-600 text-white rounded px-1.5 py-0.5 text-center"
          />
          <span className="text-gray-500">–</span>
          <span className="text-gray-500">$</span>
          <input
            type="text"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            onBlur={commitMax}
            onKeyDown={(e) => e.key === 'Enter' && commitMax()}
            className="w-12 text-xs bg-gray-800 border border-gray-600 text-white rounded px-1.5 py-0.5 text-center"
          />
        </div>
      </div>
      <Slider
        range
        min={0}
        max={MAX_IDX}
        value={[minToIdx(flowSizeMin), maxToIdx(flowSizeMax)]}
        onChange={handleSliderChange}
        styles={{
          track: { backgroundColor: '#3b82f6', height: 4 },
          rail: { backgroundColor: '#374151', height: 4 },
          handle: {
            borderColor: '#3b82f6',
            backgroundColor: '#1d4ed8',
            opacity: 1,
            width: 14,
            height: 14,
            marginTop: -5,
          },
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep FlowSizeSlider
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: all tests pass.

---

## Final Verification

- [ ] Start the dev server and open the app

```bash
npm run dev
```

- [ ] Verify globe shows satellite imagery (ArcGIS) instead of Natural Earth
- [ ] Verify country borders are visible in soft red
- [ ] Verify arcs animate with dashes flowing from donor to recipient
- [ ] Verify clicking a country in the GeoJSON layer selects it as donor in the left panel
- [ ] Verify the flow size filter shows two thumbs on one slider with two number inputs
- [ ] Verify dragging max thumb to the far right shows "∞" and removes the upper cap
- [ ] Verify dragging min thumb to the far left shows "0" and removes the lower cap

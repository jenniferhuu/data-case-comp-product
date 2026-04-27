# Globe Improvements Design

**Date:** 2026-04-26  
**Status:** Approved

## Overview

Four improvements to the PhilanthroGlobe Cesium visualization:
1. Globe rendering quality (texture, resolution, country borders)
2. Animated directional arc dashes (replace glow material)
3. Click country to select donor
4. Min/max dual-range flow size filter

---

## Section 1: Globe Rendering

### Texture
Replace `TileMapServiceImageryProvider` (Natural Earth II bundled) with ArcGIS World Imagery satellite:
```ts
ArcGisMapServerImageryProvider.fromUrl(
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
)
```

### Resolution / Antialiasing
In `CesiumGlobe.tsx` `useEffect`, after acquiring the viewer:
```ts
viewer.useBrowserRecommendedResolution = false
viewer.resolutionScale = window.devicePixelRatio
```

### Country Borders
Update GeoJSON load options in `CesiumGlobe.tsx`:
- `stroke`: `Color.fromCssColorString('#f87171').withAlpha(0.6)` (soft red)
- `strokeWidth`: `1.5`
- `fill`: `Color.TRANSPARENT` (unchanged)
- `clampToGround`: `true` (unchanged)

**Files changed:** `src/components/Globe/CesiumGlobe.tsx`

---

## Section 2: Animated Directional Arc Dashes

### Approach
Replace `PolylineGlowMaterialProperty` with a custom GPU-animated Cesium material. Animation runs entirely in GLSL via `czm_frameNumber` — no per-frame JavaScript.

### Material Definition
Register a custom material type once at module load in `ArcLayer.tsx`:
```ts
Material._materialCache.addMaterial('AnimatedDash', {
  fabric: {
    type: 'AnimatedDash',
    uniforms: { color: Color.WHITE, speed: 0.008, dashLength: 0.05 },
    source: `/* GLSL */
      czm_material czm_getMaterial(czm_materialInput materialInput) {
        czm_material material = czm_getDefaultMaterial(materialInput);
        float offset = mod(czm_frameNumber * speed, 1.0);
        float s = fract((materialInput.s + offset) / dashLength);
        if (s > 0.5) discard;
        material.diffuse = color.rgb;
        material.alpha = color.a;
        return material;
      }
    `
  },
  translucent: true
})
```

### Usage in ArcLayer
Replace `new PolylineGlowMaterialProperty(...)` with:
```ts
new Material({ fabric: { type: 'AnimatedDash', uniforms: { color: displayColor } } })
```
Pass directly to `PolylineGraphics.material`.

All existing color modes (sector, growth rate, credibility, compare) work unchanged — only the material type changes.

**Files changed:** `src/components/Globe/ArcLayer.tsx`

---

## Section 3: Click Country to Select Donor

### Current Behavior
Click handler in `CesiumGlobe.tsx` only clears selection when nothing is picked.

### New Behavior
On globe click:
1. Pick the clicked object from the scene.
2. If the picked entity belongs to the country GeoJSON DataSource (has `properties.ISO_A3`):
   - Look up `iso3` in `data.donors` to find a matching donor via `donor_iso3`.
   - If donor found: call `setDonorCountry(donor.donor_country)` AND `setSelectedDonorId(donor.donor_id)`.
   - If no donor found: call `setSelectedCountryIso3(iso3)` to open the country panel.
3. If nothing is picked: clear both (`setSelectedDonorId(null)`, `setSelectedCountryIso3(null)`).

### Store access
`CesiumGlobe.tsx` already destructures `setSelectedDonorId` and `setSelectedCountryIso3` from `useStore`. Add `setDonorCountry` to that destructure.

**Files changed:** `src/components/Globe/CesiumGlobe.tsx`

---

## Section 4: Min/Max Dual-Range Flow Size Filter

### Store Changes (`src/state/store.ts`)
Add:
```ts
flowSizeMax: number | null   // null = no upper cap
setFlowSizeMax: (n: number | null) => void
```
Default: `null`.

### Filter Changes (`src/lib/filters.ts`)
Add `flowSizeMax?: number | null` to `FilterParams`. In `applyFilters`:
```ts
if (params.flowSizeMax !== null && params.flowSizeMax !== undefined) {
  if (f.usd_disbursed_m > params.flowSizeMax) return false
}
```

### ArcLayer Changes (`src/components/Globe/ArcLayer.tsx`)
Destructure `flowSizeMax` from `useStore` and pass to `applyFilters`.

### UI: Replace `FlowSizeSlider.tsx`
Use `rc-slider` Range component (new dependency: `rc-slider`).

**Layout:**
- Label row: `"Flow size ($M)"` left, `"$[min input] – $[max input]"` right
- Slider row: single `rc-slider` Range with two thumbs
- STEPS array stays the same for snap values

**Sentinel behavior:**
- Min thumb at index 0 (leftmost) → `flowSizeMin = 0`, displays `0`
- Max thumb at index `STEPS.length - 1` (rightmost) → `flowSizeMax = null`, max input shows `∞`

**Styling:** Override `rc-slider` CSS with dark theme matching existing sidebar palette (gray-800 track, blue-500 handle/fill).

**Files changed:** `src/components/Controls/FlowSizeSlider.tsx`, `src/state/store.ts`, `src/lib/filters.ts`, `src/components/Globe/ArcLayer.tsx`

---

## File Change Summary

| File | Change |
|------|--------|
| `src/components/Globe/CesiumGlobe.tsx` | ArcGIS texture, resolution scale, border color, click-to-select-donor |
| `src/components/Globe/ArcLayer.tsx` | Animated dash material, read `flowSizeMax` |
| `src/lib/arcGeometry.ts` | No change |
| `src/state/store.ts` | Add `flowSizeMax` / `setFlowSizeMax` |
| `src/lib/filters.ts` | Add `flowSizeMax` filter check |
| `src/components/Controls/FlowSizeSlider.tsx` | Replace with dual-range `rc-slider` |

## Dependencies
- Add `rc-slider` (and `@types/rc-slider` if needed)

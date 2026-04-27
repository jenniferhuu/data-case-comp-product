# philanthroglobe — AI Context Map

> **Stack:** raw-http | none | react | typescript

> 0 routes | 0 models | 20 components | 8 lib files | 1 env vars | 0 middleware | 0% test coverage
> **Token savings:** this file is ~1,800 tokens. Without it, AI exploration would cost ~17,000 tokens. **Saves ~15,200 tokens per conversation.**
> **Last scanned:** 2026-04-27 01:39 — re-run after significant changes

---

# Components

- **App** — `src\App.tsx`
- **ArcLegend** — `src\components\Controls\ArcLegend.tsx`
- **DonorCountryFilter** — props: options — `src\components\Controls\DonorCountryFilter.tsx`
- **FlowSizeSlider** — `src\components\Controls\FlowSizeSlider.tsx`
- **MarkerSelector** — `src\components\Controls\MarkerSelector.tsx`
- **ModeToggle** — `src\components\Controls\ModeToggle.tsx`
- **SectorFilter** — props: options — `src\components\Controls\SectorFilter.tsx`
- **YearControls** — `src\components\Controls\YearControls.tsx`
- **ArcLayer** — props: data — `src\components\Globe\ArcLayer.tsx`
- **CesiumGlobe** — props: data — `src\components\Globe\CesiumGlobe.tsx`
- **CrisisAnnotations** — props: events, geo — `src\components\Globe\CrisisAnnotations.tsx`
- **Header** — `src\components\Layout\Header.tsx`
- **MethodologyFooter** — `src\components\Layout\MethodologyFooter.tsx`
- **StatsStrip** — props: data — `src\components\Layout\StatsStrip.tsx`
- **CountryPanel** — props: country — `src\components\Panel\CountryPanel.tsx`
- **DonorPanel** — props: donor, markerData — `src\components\Panel\DonorPanel.tsx`
- **MarkerCredibilityCard** — props: markerData — `src\components\Panel\MarkerCredibilityCard.tsx`
- **Panel** — props: title, onClose — `src\components\Panel\Panel.tsx`
- **Leaderboard** — props: data — `src\components\Sidebar\Leaderboard.tsx`
- **LeftSidebar** — props: data — `src\components\Sidebar\LeftSidebar.tsx`

---

# Libraries

- `scripts\build_data.py`
  - function make_slug: (name) -> str
  - function load_centroids: () -> dict
  - function resolve_iso3: (name, centroid_lookup) -> str | None
  - function sector_group: (sector_val) -> str
  - function compute_marker_stats: (group, col) -> dict
  - function main: ()
- `scripts\geocode_countries.py` — function name_to_iso3: (name) -> str | None, function main: ()
- `scripts\tests\test_build_data.py`
  - function run_pipeline: ()
  - function test_all_output_files_created: (run_pipeline)
  - function test_flows_schema: (run_pipeline)
  - function test_donor_summary_has_rank_and_iso3: (run_pipeline)
  - function test_countries_geo_includes_donor_countries: (run_pipeline)
  - function test_marker_breakdown_has_all_seven: (run_pipeline)
  - _...4 more_
- `scripts\tests\test_geocode.py`
  - function test_centroids_file_created: ()
  - function test_centroids_has_required_columns: ()
  - function test_centroids_ukraine_present: ()
  - function test_centroids_has_over_80_countries: ()
- `src\lib\arcGeometry.ts` — function generateArcPoints: (fromLat, fromLon, toLat, toLon, numPoints) => Cartesian3[]
- `src\lib\colorScales.ts`
  - function sectorColor: (sector) => Color
  - function growthRateColor: (rate) => Color
  - function credibilityColor: (score) => Color
  - function arcWidth: (usd_m) => number
  - const SECTOR_COLORS: Record<string, string>
- `src\lib\dataLoader.ts` — function loadAppData: () => Promise<AppData>
- `src\lib\filters.ts`
  - function applyFilters: (flows, params) => Flow[]
  - function getLeaderboardDonors: (flows, topN) => LeaderboardEntry[]
  - function getLeaderboardCountries: (flows, topN) => LeaderboardEntry[]
  - interface FilterParams
  - interface LeaderboardEntry

---

# Config

## Environment Variables

- `VITE_CESIUM_ION_TOKEN` (has default) — .env

## Config Files

- `tailwind.config.js`
- `tsconfig.json`
- `vercel.json`
- `vite.config.ts`

## Key Dependencies

- react: ^18.3.1

---

# Dependency Graph

## Most Imported Files (change these carefully)

- `src\state\store.ts` — imported by **14** files
- `src\lib\colorScales.ts` — imported by **4** files
- `src\lib\filters.ts` — imported by **4** files
- `src\lib\dataLoader.ts` — imported by **1** files
- `src\components\Layout\Header.tsx` — imported by **1** files
- `src\components\Layout\MethodologyFooter.tsx` — imported by **1** files
- `src\components\Layout\StatsStrip.tsx` — imported by **1** files
- `src\components\Sidebar\LeftSidebar.tsx` — imported by **1** files
- `src\components\Globe\CesiumGlobe.tsx` — imported by **1** files
- `src\components\Panel\Panel.tsx` — imported by **1** files
- `src\components\Panel\DonorPanel.tsx` — imported by **1** files
- `src\components\Panel\CountryPanel.tsx` — imported by **1** files
- `src\components\Controls\YearControls.tsx` — imported by **1** files
- `src\components\Controls\MarkerSelector.tsx` — imported by **1** files
- `src\components\Controls\ArcLegend.tsx` — imported by **1** files
- `src\lib\arcGeometry.ts` — imported by **1** files
- `src\components\Globe\ArcLayer.tsx` — imported by **1** files
- `src\components\Globe\CrisisAnnotations.tsx` — imported by **1** files
- `src\components\Controls\ModeToggle.tsx` — imported by **1** files
- `src\components\Panel\MarkerCredibilityCard.tsx` — imported by **1** files

## Import Map (who imports what)

- `src\state\store.ts` ← `src\App.tsx`, `src\components\Controls\ArcLegend.tsx`, `src\components\Controls\DonorCountryFilter.tsx`, `src\components\Controls\FlowSizeSlider.tsx`, `src\components\Controls\MarkerSelector.tsx` +9 more
- `src\lib\colorScales.ts` ← `src\components\Controls\ArcLegend.tsx`, `src\components\Globe\ArcLayer.tsx`, `src\components\Panel\CountryPanel.tsx`, `src\components\Panel\DonorPanel.tsx`
- `src\lib\filters.ts` ← `src\components\Globe\ArcLayer.tsx`, `src\components\Layout\StatsStrip.tsx`, `src\components\Sidebar\Leaderboard.tsx`, `src\lib\filters.test.ts`
- `src\lib\dataLoader.ts` ← `src\App.tsx`
- `src\components\Layout\Header.tsx` ← `src\App.tsx`
- `src\components\Layout\MethodologyFooter.tsx` ← `src\App.tsx`
- `src\components\Layout\StatsStrip.tsx` ← `src\App.tsx`
- `src\components\Sidebar\LeftSidebar.tsx` ← `src\App.tsx`
- `src\components\Globe\CesiumGlobe.tsx` ← `src\App.tsx`
- `src\components\Panel\Panel.tsx` ← `src\App.tsx`

---

# Test Coverage

> **0%** of routes and models are covered by tests
> 3 test files found

---

_Generated by [codesight](https://github.com/Houseofmvps/codesight) — see your codebase clearly_
# philanthroglobe — AI Context Map

> **Stack:** next-app | none | react | typescript

> 4 routes | 0 models | 31 components | 37 lib files | 1 env vars | 0 middleware
> **Token savings:** this file is ~0 tokens. Without it, AI exploration would cost ~0 tokens. **Saves ~0 tokens per conversation.**
> **Last scanned:** 2026-04-27 12:08 — re-run after significant changes

---

# Routes

- `GET` `/api/drilldown`
- `GET` `/api/filters`
- `GET` `/api/globe`
- `GET` `/api/overview`

---

# Components

- **RootLayout** — `src\app\layout.tsx`
- **HomePage** — `src\app\page.tsx`
- **App** — `src\App.tsx`
- **ArcLegend** — `src\components\Controls\ArcLegend.tsx`
- **DonorCountryFilter** — props: options — `src\components\Controls\DonorCountryFilter.tsx`
- **FlowSizeSlider** — `src\components\Controls\FlowSizeSlider.tsx`
- **MarkerSelector** — `src\components\Controls\MarkerSelector.tsx`
- **ModeToggle** — `src\components\Controls\ModeToggle.tsx`
- **SectorFilter** — props: options — `src\components\Controls\SectorFilter.tsx`
- **YearControls** — `src\components\Controls\YearControls.tsx`
- **ControlRail** [client] — `src\components\dashboard\ControlRail.tsx`
- **DashboardShell** [client] — `src\components\dashboard\DashboardShell.tsx`
- **HeroStats** [client] — props: overview — `src\components\dashboard\HeroStats.tsx`
- **InsightRail** [client] — props: overview, drilldown — `src\components\dashboard\InsightRail.tsx`
- **TrendDrawer** — props: eyebrow, title, items — `src\components\dashboard\TrendDrawer.tsx`
- **ArcLayer** — props: data — `src\components\Globe\ArcLayer.tsx`
- **CesiumGlobe** — props: data — `src\components\Globe\CesiumGlobe.tsx`
- **CrisisAnnotations** — props: events, geo — `src\components\Globe\CrisisAnnotations.tsx`
- **GlobeIdleController** [client] — `src\components\Globe\GlobeIdleController.tsx`
- **GlobeScene** [client] — `src\components\Globe\GlobeScene.tsx`
- **Header** — `src\components\Layout\Header.tsx`
- **MethodologyFooter** — `src\components\Layout\MethodologyFooter.tsx`
- **StatsStrip** — props: data — `src\components\Layout\StatsStrip.tsx`
- **CountryPanel** — props: country — `src\components\Panel\CountryPanel.tsx`
- **DonorPanel** — props: donor, markerData — `src\components\Panel\DonorPanel.tsx`
- **MarkerCredibilityCard** — props: markerData — `src\components\Panel\MarkerCredibilityCard.tsx`
- **Panel** — props: title, onClose — `src\components\Panel\Panel.tsx`
- **CountryDrilldown** — props: country — `src\components\panels\CountryDrilldown.tsx`
- **DonorDrilldown** — props: donor — `src\components\panels\DonorDrilldown.tsx`
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
- `src\app\api\drilldown\route.ts` — function GET: (request) => void
- `src\app\api\filters\route.ts` — function GET: () => void
- `src\app\api\globe\route.ts` — function GET: (request) => void
- `src\app\api\overview\route.ts` — function GET: () => void
- `src\components\Globe\globePresentation.ts`
  - function buildGlobePresentation: (flows, geo) => GlobePresentation
  - interface GeoCountry
  - interface GlobeArcDatum
  - interface GlobePointDatum
  - interface GlobePresentation
- `src\features\dashboard\queryState.ts`
  - function parseDashboardQuery: (searchParams?) => DashboardQuery
  - function mergeDashboardQuery: (currentQuery, patch) => DashboardQuery
  - function createDashboardSearchParams: (query) => URLSearchParams
- `src\features\filters\derivedData.ts`
  - function buildFilterParams: (input) => Extract<CanonicalFilterParams,
  - function buildFilterParams: (input) => Extract<CanonicalFilterParams,
  - function buildFilterParams: (input) => CanonicalFilterParams
  - function getFilteredFlows: (data, params) => Flow[]
  - function getFlowStats: (flows) => void
  - function getLeaderboardEntries: (flows, kind, topN) => LeaderboardEntry[]
  - _...4 more_
- `src\features\filters\storeFilters.ts`
  - function getStoreFilterSnapshot: (state) => Extract<CanonicalFilterParams,
  - function getStoreFilterSnapshot: (state) => Extract<CanonicalFilterParams,
  - function getStoreFilterSnapshot: (state) => CanonicalFilterParams
  - function getStoreFilterSnapshotFromState: (state) => CanonicalFilterParams
  - function useStoreFilterSnapshot: () => CanonicalFilterParams
  - type StoreCompareFilterInput
  - _...3 more_
- `src\features\selection\selectionActions.ts`
  - function selectDonorState: (state, donorId) => DrilldownSelectionState
  - function selectCountryState: (state, iso3) => DrilldownSelectionState
  - function clearSelectionState: (state) => DrilldownSelectionState
  - function applyGlobeSelectionState: (currentSelection, nextSelection) => SelectionState
  - interface DrilldownSelectionState
  - interface SelectionState
- `src\lib\animatedDashMaterial.ts` — class AnimatedDashMaterialProperty
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
- `src\lib\globeSelection.ts`
  - function getCountryIso3: (properties?) => string | undefined
  - function getFlowRecipientIso3FromEntityName: (name?) => string | undefined
  - function disableDefaultViewerInputActions: (viewer) => void
  - function clearViewerEntityFocus: (viewer) => void
  - function getPickedCountryEntity: (hits, containsEntity) => void
  - function resolveGlobeSelection: (clickedIso3, donorSummaries, 'donor_id' | 'donor_country' | 'donor_iso3'>[]) => GlobeSelectionState
  - _...6 more_
- `src\pipeline\derive\buildDrilldownArtifact.ts` — function buildDrilldownArtifact: (rows) => DrilldownsArtifact, interface DrilldownsArtifact
- `src\pipeline\derive\buildFiltersArtifact.ts` — function buildFiltersArtifact: (rows) => FiltersArtifact, interface FiltersArtifact
- `src\pipeline\derive\buildGlobeArtifact.ts` — function buildGlobeArtifact: (rows) => GlobeArtifact
- `src\pipeline\derive\buildOverviewArtifact.ts` — function buildOverviewArtifact: (rows) => OverviewResponse
- `src\pipeline\index.ts` — function ensureRequiredColumns: (rows, string>[], required) => void, function runPipeline: () => void
- `src\pipeline\loaders\loadEnrichment.ts` — function loadEnrichment: (fileName) => Promise<RawEnrichmentRow[]>, interface RawEnrichmentRow
- `src\pipeline\loaders\loadPrimaryCsv.ts` — function loadPrimaryCsv: () => Promise<RawFundingRow[]>, interface RawFundingRow
- `src\pipeline\normalize\normalizeRows.ts` — function normalizeRows: (rows, string>[]) => CanonicalFundingRow[], interface CanonicalFundingRow
- `src\pipeline\normalize\resolveCountry.ts` — function resolveCountry: (row, string>) => CanonicalRecipient, interface CanonicalRecipient
- `src\pipeline\normalize\resolveDonor.ts` — function resolveDonor: (row, string>) => CanonicalDonor, interface CanonicalDonor
- `src\pipeline\writeArtifacts.ts` — function writeArtifact: (name, data) => Promise<void>
- `src\server\api\handleApiRequest.ts` — function handleApiRequest: (load) => void
- `src\server\repositories\artifactRepository.ts` — function readArtifactJson: (name) => Promise<unknown>, type ArtifactName
- `src\server\repositories\geoRepository.ts` — function readCountriesGeoJson: () => Promise<GeoCountry[]>
- `src\server\services\drilldownService.ts` — function getDrilldown: (searchParams?) => Promise<DrilldownResponse>
- `src\server\services\filterService.ts` — function getFilters: () => Promise<FiltersArtifact>
- `src\server\services\globeService.ts` — function getGlobeData: (searchParams?) => Promise<GlobeResponse>
- `src\server\services\overviewService.ts` — function getOverview: () => Promise<OverviewResponse>

---

# Config

## Environment Variables

- `VITE_CESIUM_ION_TOKEN` (has default) — .env

## Config Files

- `next.config.ts`
- `tailwind.config.js`
- `tsconfig.json`
- `vercel.json`

## Key Dependencies

- next: ^15.0.0
- react: ^19.0.0
- zod: ^3.23.8

---

# Dependency Graph

## Most Imported Files (change these carefully)

- `src\state\store.ts` — imported by **15** files
- `src\contracts\overview.ts` — imported by **9** files
- `src\features\dashboard\useDashboardState.ts` — imported by **7** files
- `src\contracts\drilldown.ts` — imported by **7** files
- `src\pipeline\normalize\normalizeRows.ts` — imported by **7** files
- `src\contracts\globe.ts` — imported by **6** files
- `src\contracts\filters.ts` — imported by **6** files
- `src\features\filters\derivedData.ts` — imported by **5** files
- `src\features\dashboard\queryState.ts` — imported by **5** files
- `src\pipeline\config.ts` — imported by **5** files
- `src\server\services\drilldownService.ts` — imported by **4** files
- `src\server\api\handleApiRequest.ts` — imported by **4** files
- `src\components\dashboard\DashboardShell.tsx` — imported by **4** files
- `src\lib\colorScales.ts` — imported by **4** files
- `src\features\filters\storeFilters.ts` — imported by **4** files
- `src\components\Globe\globePresentation.ts` — imported by **4** files
- `src\server\repositories\artifactRepository.ts` — imported by **4** files
- `src\app\api\overview\route.ts` — imported by **4** files
- `src\server\services\filterService.ts` — imported by **3** files
- `src\pipeline\index.ts` — imported by **3** files

## Import Map (who imports what)

- `src\state\store.ts` ← `src\App.tsx`, `src\components\Controls\ArcLegend.tsx`, `src\components\Controls\DonorCountryFilter.tsx`, `src\components\Controls\FlowSizeSlider.tsx`, `src\components\Controls\MarkerSelector.tsx` +10 more
- `src\contracts\overview.ts` ← `src\components\dashboard\DashboardShell.tsx`, `src\components\dashboard\HeroStats.tsx`, `src\components\dashboard\InsightRail.tsx`, `src\contracts\index.ts`, `src\pipeline\derive\buildOverviewArtifact.ts` +4 more
- `src\features\dashboard\useDashboardState.ts` ← `src\components\dashboard\ControlRail.tsx`, `src\components\dashboard\InsightRail.tsx`, `src\components\Globe\GlobeIdleController.tsx`, `src\components\Globe\GlobeScene.tsx`, `tests\server\control-rail.test.tsx` +2 more
- `src\contracts\drilldown.ts` ← `src\components\dashboard\InsightRail.tsx`, `src\components\panels\CountryDrilldown.tsx`, `src\components\panels\DonorDrilldown.tsx`, `src\contracts\index.ts`, `src\pipeline\derive\buildDrilldownArtifact.ts` +2 more
- `src\pipeline\normalize\normalizeRows.ts` ← `src\pipeline\derive\buildDrilldownArtifact.ts`, `src\pipeline\derive\buildFiltersArtifact.ts`, `src\pipeline\derive\buildGlobeArtifact.ts`, `src\pipeline\derive\buildOverviewArtifact.ts`, `src\pipeline\index.ts` +2 more
- `src\contracts\globe.ts` ← `src\components\Globe\globePresentation.ts`, `src\components\Globe\GlobeScene.tsx`, `src\contracts\index.ts`, `src\pipeline\derive\buildGlobeArtifact.ts`, `src\server\services\globeService.ts` +1 more
- `src\contracts\filters.ts` ← `src\contracts\index.ts`, `src\features\dashboard\queryState.ts`, `src\features\dashboard\useDashboardState.ts`, `src\server\services\drilldownService.ts`, `src\server\services\globeService.ts` +1 more
- `src\features\filters\derivedData.ts` ← `src\components\Globe\ArcLayer.tsx`, `src\components\Layout\StatsStrip.tsx`, `src\components\Sidebar\Leaderboard.tsx`, `src\features\filters\derivedData.test.ts`, `src\features\filters\storeFilters.ts`
- `src\features\dashboard\queryState.ts` ← `src\components\Globe\GlobeScene.tsx`, `src\features\dashboard\useDashboardState.ts`, `tests\server\control-rail.test.tsx`, `tests\server\dashboard-shell.test.tsx`, `tests\server\drilldown.test.tsx`
- `src\pipeline\config.ts` ← `src\pipeline\index.ts`, `src\pipeline\loaders\loadEnrichment.ts`, `src\pipeline\loaders\loadPrimaryCsv.ts`, `src\pipeline\writeArtifacts.ts`, `src\server\repositories\artifactRepository.ts`

---

_Generated by [codesight](https://github.com/Houseofmvps/codesight) — see your codebase clearly_
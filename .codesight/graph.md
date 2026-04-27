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

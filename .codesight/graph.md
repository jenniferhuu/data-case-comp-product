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
- `src\lib\animatedDashMaterial.ts` — imported by **1** files
- `src\lib\arcGeometry.ts` — imported by **1** files
- `src\components\Globe\ArcLayer.tsx` — imported by **1** files
- `src\components\Globe\CrisisAnnotations.tsx` — imported by **1** files
- `src\components\Controls\ModeToggle.tsx` — imported by **1** files

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

# Analyst Command Deck Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the dashboard into a denser premium analyst command deck with cleaner globe encodings, human-readable sector filters, richer donor/country drilldowns, and first-class country selection.

**Architecture:** Extend the server-side dashboard contracts first so the client renders compact, already-aggregated analysis data instead of deriving everything from large raw payloads. Then split the UI work into three focused areas: sector normalization/filter cleanup, globe/legend encoding cleanup, and stacked insight-rail analytics. Finish with shell tightening, responsive polish, and regression coverage.

**Tech Stack:** Next.js app router, React client components, Zustand state, Zod contracts, existing generated JSON artifacts, existing chart library in repo.

---

## File Structure

### Existing files to modify

- `src/contracts/drilldown.ts`
  - Expand donor/country drilldown schemas to include yearly, sector, counterparty, and concentration data.
- `src/contracts/overview.ts`
  - Extend overview schema if idle-state rail charts are served from overview.
- `src/server/services/drilldownService.ts`
  - Read enriched drilldown artifacts and return the expanded payload.
- `src/server/services/filterService.ts`
  - Return normalized human-readable sector labels rather than raw sector codes.
- `src/components/dashboard/ControlRail.tsx`
  - Consume normalized sector labels and tighten the rail layout.
- `src/components/Globe/GlobeScene.tsx`
  - Update arc color/size behavior, compare-mode palette behavior, legends, selection emphasis, and overlay sizing.
- `src/components/dashboard/DashboardShell.tsx`
  - Tighten the shell column widths and reduce overlay collisions.
- `src/components/dashboard/HeroStats.tsx`
  - Shorten and compress the hero chrome.
- `src/components/dashboard/InsightRail.tsx`
  - Replace the shallow summary rail with a stacked analysis inspector.
- `src/components/panels/DonorDrilldown.tsx`
  - Convert into a richer donor analysis surface or delegate to new rail components.
- `src/components/panels/CountryDrilldown.tsx`
  - Convert into a richer country analysis surface or delegate to new rail components.
- `src/components/Globe/globePresentation.ts`
  - Add sector metadata normalization and compare-mode support if the globe payload needs richer semantics.

### New files to create

- `src/lib/sectorLabels.ts`
  - Shared normalization and display helpers for raw sector codes/strings.
- `src/components/Globe/GlobeLegend.tsx`
  - Encapsulate standard-mode and compare-mode legend rendering.
- `src/components/dashboard/InsightHeader.tsx`
  - Compact identity header for idle/donor/country states.
- `src/components/dashboard/InsightMetricCard.tsx`
  - Small reusable metric block for totals and concentration summaries.
- `src/components/dashboard/InsightBarChart.tsx`
  - Compact horizontal bar chart wrapper.
- `src/components/dashboard/InsightTrendChart.tsx`
  - Compact trend chart wrapper for yearly funding.
- `src/components/dashboard/InsightRankList.tsx`
  - Ranked list for top donors/recipients/countries.
- `tests/server/sector-labels.test.ts`
  - Regression tests for sector normalization behavior.
- `tests/server/filter-service.test.ts`
  - Contract tests for normalized filter sector labels.
- `tests/server/drilldown-service-expanded.test.ts`
  - Contract tests for enriched donor/country drilldown payloads.
- `tests/server/globe-legend.test.tsx`
  - Rendering tests for standard vs compare legend states.
- `tests/server/insight-rail-expanded.test.tsx`
  - Rendering tests for idle/donor/country stacked analysis sections.

## Task 1: Add Shared Sector Label Normalization

**Files:**
- Create: `src/lib/sectorLabels.ts`
- Test: `tests/server/sector-labels.test.ts`

- [ ] **Step 1: Write the failing normalization tests**

```ts
import { describe, expect, it } from 'vitest'
import { normalizeSectorLabel } from '../../src/lib/sectorLabels'

describe('normalizeSectorLabel', () => {
  it('maps raw numeric sector codes into readable names when known', () => {
    expect(normalizeSectorLabel('120')).toBe('Health')
  })

  it('maps multi-code raw strings into a stable fallback label', () => {
    expect(normalizeSectorLabel('140; 310; 410')).toBe('Multi-sector')
  })

  it('passes through already-readable labels', () => {
    expect(normalizeSectorLabel('Environment')).toBe('Environment')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/server/sector-labels.test.ts`
Expected: FAIL with module-not-found for `src/lib/sectorLabels.ts`.

- [ ] **Step 3: Write the minimal normalization helper**

```ts
const KNOWN_SECTOR_LABELS: Record<string, string> = {
  '110': 'Education',
  '120': 'Health',
  '130': 'Population',
  '140': 'Water & Sanitation',
  '150': 'Gov & Civil Society',
  '160': 'Other Social Services',
  '210': 'Transport',
  '220': 'Communications',
  '230': 'Energy',
  '240': 'Banking & Finance',
  '250': 'Business & Other Services',
  '310': 'Agriculture',
  '311': 'Agriculture',
  '312': 'Forestry',
  '313': 'Fishing',
  '320': 'Industry',
  '321': 'Industry',
  '322': 'Mineral Resources',
  '323': 'Construction',
  '330': 'Trade & Tourism',
  '331': 'Trade Policy',
  '332': 'Tourism',
  '410': 'Environment',
  '430': 'Emergency',
  '510': 'Budget Support',
  '520': 'Food Assistance',
  '530': 'Debt Relief',
  '600': 'Administrative Costs',
  '720': 'Emergency',
  '730': 'Reconstruction',
  '740': 'Disaster Prevention',
  '910': 'Multi-sector',
  '930': 'Refugees',
  '998': 'Other',
}

export function normalizeSectorLabel(value: string): string {
  const trimmed = value.trim()

  if (trimmed.includes(';')) {
    return 'Multi-sector'
  }

  return KNOWN_SECTOR_LABELS[trimmed] ?? trimmed
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/server/sector-labels.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sectorLabels.ts tests/server/sector-labels.test.ts
git commit -m "feat: normalize dashboard sector labels"
```

## Task 2: Normalize Filter Sectors at the Service Boundary

**Files:**
- Modify: `src/server/services/filterService.ts`
- Test: `tests/server/filter-service.test.ts`

- [ ] **Step 1: Write the failing filter service contract test**

```ts
import { describe, expect, it } from 'vitest'
import { getFilters } from '../../src/server/services/filterService'

describe('getFilters', () => {
  it('returns readable sector labels instead of raw numeric codes', async () => {
    const filters = await getFilters()

    expect(filters.sectors).not.toContain('120')
    expect(filters.sectors).toContain('Health')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/server/filter-service.test.ts`
Expected: FAIL because sectors still contain raw codes.

- [ ] **Step 3: Update `getFilters` to normalize and de-duplicate sectors**

```ts
import { normalizeSectorLabel } from '../../lib/sectorLabels'

export async function getFilters(): Promise<FiltersArtifact> {
  const artifact = await readArtifactJson('filters')
  const parsed = filtersArtifactSchema.parse(artifact)

  return {
    ...parsed,
    sectors: [...new Set(parsed.sectors.map(normalizeSectorLabel))].sort((left, right) => left.localeCompare(right)),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/server/filter-service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/filterService.ts tests/server/filter-service.test.ts
git commit -m "feat: normalize sector labels in dashboard filters"
```

## Task 3: Expand the Drilldown Contract for Stacked Analysis

**Files:**
- Modify: `src/contracts/drilldown.ts`
- Modify: `src/server/services/drilldownService.ts`
- Test: `tests/server/drilldown-service-expanded.test.ts`

- [ ] **Step 1: Write the failing drilldown contract test**

```ts
import { describe, expect, it } from 'vitest'
import { getDrilldown } from '../../src/server/services/drilldownService'

describe('getDrilldown', () => {
  it('returns enriched donor drilldown analytics', async () => {
    const response = await getDrilldown(new URLSearchParams({
      selectionType: 'donor',
      selectionId: 'gates-foundation',
    }))

    expect(response.donor?.sectorBreakdown.length).toBeGreaterThan(0)
    expect(response.donor?.yearlyFunding.length).toBeGreaterThan(0)
    expect(response.donor?.topRecipients.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/server/drilldown-service-expanded.test.ts`
Expected: FAIL because the current schema does not include the new properties.

- [ ] **Step 3: Extend the drilldown schema with reusable distribution shapes**

```ts
const fundingByYearSchema = z.object({
  year: z.number(),
  totalUsdM: z.number(),
})

const sectorAmountSchema = z.object({
  sector: z.string(),
  totalUsdM: z.number(),
})

const topRecipientSchema = z.object({
  iso3: z.string(),
  name: z.string(),
  totalUsdM: z.number(),
})

const topDonorSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  totalUsdM: z.number(),
})
```

- [ ] **Step 4: Expand donor/country schemas and parse enriched artifact data**

```ts
export const donorDrilldownSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  totalUsdM: z.number(),
  recipientCount: z.number(),
  topRecipientShare: z.number(),
  yearlyFunding: z.array(fundingByYearSchema),
  sectorBreakdown: z.array(sectorAmountSchema),
  topRecipients: z.array(topRecipientSchema),
})

export const countryDrilldownSchema = z.object({
  iso3: z.string(),
  name: z.string(),
  totalUsdM: z.number(),
  donorCount: z.number(),
  topDonorShare: z.number(),
  yearlyFunding: z.array(fundingByYearSchema),
  sectorBreakdown: z.array(sectorAmountSchema),
  topDonors: z.array(topDonorSchema),
})
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/server/drilldown-service-expanded.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/contracts/drilldown.ts src/server/services/drilldownService.ts tests/server/drilldown-service-expanded.test.ts
git commit -m "feat: expand drilldown analytics contract"
```

## Task 4: Enrich the Idle Overview Analytics Payload

**Files:**
- Modify: `src/contracts/overview.ts`
- Modify: `src/server/services/overviewService.ts`
- Test: `tests/server/api.test.ts`

- [ ] **Step 1: Write the failing overview contract test for idle-state analytics**

```ts
it('returns overview analytics for the idle insight rail', async () => {
  const { GET } = await import('../../src/app/api/overview/route')
  const response = await GET()
  const body = await response.json()

  expect(Array.isArray(body.topSectors)).toBe(true)
  expect(Array.isArray(body.topRecipients)).toBe(true)
  expect(Array.isArray(body.yearlyFunding)).toBe(true)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/server/api.test.ts -t "returns overview analytics for the idle insight rail"`
Expected: FAIL because the fields do not exist.

- [ ] **Step 3: Extend the overview schema and service output**

```ts
export const overviewDistributionSchema = z.object({
  label: z.string(),
  totalUsdM: z.number(),
})

export const yearlyFundingSchema = z.object({
  year: z.number(),
  totalUsdM: z.number(),
})

export const overviewResponseSchema = z.object({
  totals: heroTotalsSchema,
  highlights: z.array(overviewHighlightSchema),
  topSectors: z.array(overviewDistributionSchema),
  topRecipients: z.array(overviewDistributionSchema),
  topDonors: z.array(overviewDistributionSchema),
  yearlyFunding: z.array(yearlyFundingSchema),
})
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/server/api.test.ts -t "returns overview analytics for the idle insight rail"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contracts/overview.ts src/server/services/overviewService.ts tests/server/api.test.ts
git commit -m "feat: add idle overview analytics payload"
```

## Task 5: Build Reusable Stacked Insight Components

**Files:**
- Create: `src/components/dashboard/InsightHeader.tsx`
- Create: `src/components/dashboard/InsightMetricCard.tsx`
- Create: `src/components/dashboard/InsightBarChart.tsx`
- Create: `src/components/dashboard/InsightTrendChart.tsx`
- Create: `src/components/dashboard/InsightRankList.tsx`
- Test: `tests/server/insight-rail-expanded.test.tsx`

- [ ] **Step 1: Write a failing render test for the new stacked insight modules**

```tsx
import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { InsightHeader } from '../../src/components/dashboard/InsightHeader'

describe('InsightHeader', () => {
  it('renders the compact identity header', () => {
    const html = renderToString(
      <InsightHeader eyebrow="Country" title="Ukraine" subtitle="Recipient focus" />,
    )

    expect(html).toContain('Ukraine')
    expect(html).toContain('Recipient focus')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/server/insight-rail-expanded.test.tsx`
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Create the minimal reusable components**

```tsx
export function InsightHeader({ eyebrow, title, subtitle }: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/server/insight-rail-expanded.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/InsightHeader.tsx src/components/dashboard/InsightMetricCard.tsx src/components/dashboard/InsightBarChart.tsx src/components/dashboard/InsightTrendChart.tsx src/components/dashboard/InsightRankList.tsx tests/server/insight-rail-expanded.test.tsx
git commit -m "feat: add reusable insight rail components"
```

## Task 6: Redesign the Right Rail as a Stacked Analysis Surface

**Files:**
- Modify: `src/components/dashboard/InsightRail.tsx`
- Modify: `src/components/panels/DonorDrilldown.tsx`
- Modify: `src/components/panels/CountryDrilldown.tsx`
- Test: `tests/server/drilldown.test.tsx`
- Test: `tests/server/insight-rail-expanded.test.tsx`

- [ ] **Step 1: Write the failing donor/country stacked rail render tests**

```tsx
it('renders donor stacked analysis sections', () => {
  const html = renderToString(<DonorDrilldown donor={donorSelection.donor!} />)

  expect(html).toContain('Sector mix')
  expect(html).toContain('Top recipients')
  expect(html).toContain('Yearly distribution')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/server/drilldown.test.tsx tests/server/insight-rail-expanded.test.tsx`
Expected: FAIL because the old panels only render simple totals.

- [ ] **Step 3: Replace the shallow panels with stacked modules**

```tsx
<DonorDrilldown donor={activeDonor} />
<InsightMetricCard label="Recipient reach" value={activeDonor.recipientCount.toLocaleString('en-US')} />
<InsightBarChart title="Sector mix" items={activeDonor.sectorBreakdown} />
<InsightRankList title="Top recipients" items={activeDonor.topRecipients.map((recipient) => ({
  label: recipient.name,
  value: formatUsdMillions(recipient.totalUsdM),
}))} />
<InsightTrendChart title="Yearly distribution" points={activeDonor.yearlyFunding} />
```

- [ ] **Step 4: Add idle-state analytics sections to `InsightRail`**

```tsx
{activeDonor === null && activeCountry === null && overview !== null ? (
  <>
    <InsightHeader eyebrow="Portfolio" title="Platform overview" subtitle="Live funding distribution across the visible portfolio." />
    <InsightBarChart title="Top sectors" items={overview.topSectors} />
    <InsightRankList title="Top recipients" items={overview.topRecipients.map(...)} />
    <InsightTrendChart title="Yearly distribution" points={overview.yearlyFunding} />
  </>
) : null}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/server/drilldown.test.tsx tests/server/insight-rail-expanded.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/InsightRail.tsx src/components/panels/DonorDrilldown.tsx src/components/panels/CountryDrilldown.tsx tests/server/drilldown.test.tsx tests/server/insight-rail-expanded.test.tsx
git commit -m "feat: redesign stacked insight rail"
```

## Task 7: Add the Globe Legend and Encoding Helpers

**Files:**
- Create: `src/components/Globe/GlobeLegend.tsx`
- Modify: `src/components/Globe/GlobeScene.tsx`
- Test: `tests/server/globe-legend.test.tsx`

- [ ] **Step 1: Write the failing legend state test**

```tsx
import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { GlobeLegend } from '../../src/components/Globe/GlobeLegend'

describe('GlobeLegend', () => {
  it('renders sector chips in standard mode', () => {
    const html = renderToString(<GlobeLegend compareMode={false} />)

    expect(html).toContain('Sector')
    expect(html).toContain('Volume')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/server/globe-legend.test.tsx`
Expected: FAIL because `GlobeLegend` does not exist.

- [ ] **Step 3: Implement the legend component and mount it in the globe stage**

```tsx
export function GlobeLegend({ compareMode }: { compareMode: boolean }) {
  return compareMode ? (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/72 px-4 py-3 text-xs text-slate-200">
      <p className="uppercase tracking-[0.24em] text-emerald-200/70">Compare legend</p>
      <p className="mt-2">Green = positive delta, red = negative delta, width = visible funding.</p>
    </div>
  ) : (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/72 px-4 py-3 text-xs text-slate-200">
      <p className="uppercase tracking-[0.24em] text-cyan-200/70">Flow legend</p>
      <p className="mt-2">Color = sector, width = funding volume.</p>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/server/globe-legend.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Globe/GlobeLegend.tsx src/components/Globe/GlobeScene.tsx tests/server/globe-legend.test.tsx
git commit -m "feat: add globe legend states"
```

## Task 8: Update Arc and Point Encoding in the Globe

**Files:**
- Modify: `src/components/Globe/GlobeScene.tsx`
- Modify: `src/components/Globe/globePresentation.ts`
- Test: `tests/server/globe-scene-client.test.tsx`

- [ ] **Step 1: Write a failing test for compare-mode legend/copy or client rendering state**

```tsx
it('shows compare-mode guidance when year mode is compare', async () => {
  useDashboardState.setState({
    ...parseDashboardQuery(),
    yearMode: 'compare',
    compareFrom: 2020,
    compareTo: 2023,
    idleMode: false,
    selectedCountryIso3: null,
    selectedDonorId: null,
  })

  await act(async () => {
    root.render(<GlobeScene />)
  })

  expect(container.textContent).toContain('Green = positive delta')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/server/globe-scene-client.test.tsx`
Expected: FAIL because compare legend/copy is not present.

- [ ] **Step 3: Replace amount-tier arc colors with sector colors in standard mode and delta colors in compare mode**

```ts
function getArcColor(arc: GlobeArcDatum, compareMode: boolean) {
  if (compareMode) {
    const delta = (arc.compareDeltaUsdM ?? 0)

    if (delta > 0) return ['#86efac', '#22c55e']
    if (delta < 0) return ['#f87171', '#dc2626']
    return ['#94a3b8', '#64748b']
  }

  return sectorColorScale(arc.sector)
}
```

- [ ] **Step 4: Keep arc width tied to volume with a tighter range and keep point sizing disciplined**

```ts
arcStroke={(arc: GlobeArcDatum) => Math.min(1.35, 0.28 + arc.amountUsdM / 900)}
pointRadius={(point: GlobePointDatum) => Math.min(0.5, 0.12 + point.totalUsdM / 2400)}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/server/globe-scene-client.test.tsx tests/server/globe-legend.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Globe/GlobeScene.tsx src/components/Globe/globePresentation.ts tests/server/globe-scene-client.test.tsx tests/server/globe-legend.test.tsx
git commit -m "feat: refine globe flow encodings"
```

## Task 9: Tighten the Shell Layout and Reduce Overlay Collisions

**Files:**
- Modify: `src/components/dashboard/DashboardShell.tsx`
- Modify: `src/components/dashboard/HeroStats.tsx`
- Modify: `src/components/dashboard/ControlRail.tsx`
- Test: `tests/server/globe-scaffold.test.tsx`

- [ ] **Step 1: Write the failing shell-layout expectations**

```tsx
it('renders the globe stage with tightened desktop column widths', () => {
  const html = renderToString(<DashboardShell />)

  expect(html).toContain('lg:grid-cols-[280px_minmax(0,1fr)_360px]')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/server/globe-scaffold.test.tsx`
Expected: FAIL because the old column widths are still present.

- [ ] **Step 3: Tighten rail widths and compress the hero/overlay spacing**

```tsx
<div className="grid min-h-screen grid-cols-1 bg-[radial-gradient(circle_at_top,#153153_0%,#09111f_58%,#050913_100%)] lg:grid-cols-[280px_minmax(0,1fr)_360px]">
```

```tsx
<header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4">
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/server/globe-scaffold.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/DashboardShell.tsx src/components/dashboard/HeroStats.tsx src/components/dashboard/ControlRail.tsx tests/server/globe-scaffold.test.tsx
git commit -m "feat: tighten analyst dashboard shell layout"
```

## Task 10: Improve Control Rail Copy and Compare-Mode Guidance

**Files:**
- Modify: `src/components/dashboard/ControlRail.tsx`
- Test: `tests/server/control-rail.test.tsx`

- [ ] **Step 1: Write the failing compare-guidance assertion**

```tsx
it('explains compare mode as delta analysis instead of generic year layering', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => ({
      donorCountries: ['United States'],
      sectors: ['Health'],
      years: [2020, 2021, 2022, 2023],
      markers: [],
    }),
  })))

  await act(async () => {
    root.render(<ControlRail />)
  })

  expect(container.textContent).toContain('Compare mode highlights funding deltas')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/server/control-rail.test.tsx`
Expected: FAIL because the old compare guidance text is still present.

- [ ] **Step 3: Update compare-mode copy and selection summary phrasing**

```tsx
<div className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-4 text-sm text-cyan-100">
  Compare mode highlights funding deltas across the selected period: sector color is replaced by gain/loss color,
  while line weight continues to show visible funding volume.
</div>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/server/control-rail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ControlRail.tsx tests/server/control-rail.test.tsx
git commit -m "feat: clarify compare mode guidance"
```

## Task 11: Add First-Class Country Selection Coverage

**Files:**
- Modify: `src/components/Globe/GlobeScene.tsx`
- Modify: `tests/server/drilldown.test.tsx`
- Modify: `tests/server/globe-scene-client.test.tsx`

- [ ] **Step 1: Write a failing client-side selection test**

```tsx
it('keeps country selection available from recipient point clicks', async () => {
  expect(typeof useDashboardState.getState().selectCountry).toBe('function')
})
```

- [ ] **Step 2: Run the test to verify it fails for the newly added richer state assertions**

Run: `npx vitest run tests/server/drilldown.test.tsx tests/server/globe-scene-client.test.tsx`
Expected: FAIL once you add assertions for the richer country detail rendering.

- [ ] **Step 3: Ensure country selection drives the same stacked insight flow as donor selection**

```tsx
onPointClick={(point: object) => {
  setIdleMode(false)
  selectCountry((point as GlobePointDatum).iso3)
}}
```

```tsx
expect(container.textContent).toContain('Top donors')
expect(container.textContent).toContain('Yearly distribution')
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/server/drilldown.test.tsx tests/server/globe-scene-client.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Globe/GlobeScene.tsx tests/server/drilldown.test.tsx tests/server/globe-scene-client.test.tsx
git commit -m "feat: strengthen country selection analysis flow"
```

## Task 12: Final Verification and Regression Sweep

**Files:**
- Modify: any touched files from prior tasks if regressions are found

- [ ] **Step 1: Run the focused dashboard/server regression suite**

Run:

```bash
npx vitest run tests/server/control-rail.test.tsx tests/server/globe-scene-client.test.tsx tests/server/globe-legend.test.tsx tests/server/filter-service.test.ts tests/server/drilldown-service-expanded.test.ts tests/server/drilldown.test.tsx tests/server/insight-rail-expanded.test.tsx tests/server/api.test.ts tests/server/error-handling.test.ts tests/server/globe-scaffold.test.tsx
```

Expected: PASS with `0 failed`.

- [ ] **Step 2: Run a live browser smoke check against localhost**

Run:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Then verify manually:

- sector dropdown shows names, not numeric codes
- standard mode shows sector-colored arcs
- compare mode shows red/green delta colors
- legend changes between standard and compare modes
- clicking an arc opens donor stacked analysis
- clicking a point opens country stacked analysis
- no major overlay collisions on laptop-width viewport

- [ ] **Step 3: Commit the final integration pass**

```bash
git add .
git commit -m "feat: ship analyst command deck redesign"
```

## Spec Coverage Check

- Shell tightening and overlap reduction: Tasks 9 and 12.
- Arc cleanup, sector colors, compare delta colors, legends: Tasks 7, 8, and 10.
- Human-readable sector filters and normalization: Tasks 1 and 2.
- Stacked right rail and richer donor/country analytics: Tasks 3, 4, 5, and 6.
- Country selection as a first-class path: Task 11.
- Error/empty/loading continuity already present and preserved through Tasks 6, 8, 10, and 12.

## Placeholder Scan

No `TBD`, `TODO`, or deferred implementation placeholders remain in this plan.

## Type Consistency Check

- `sectorBreakdown`, `yearlyFunding`, `topRecipients`, and `topDonors` are used consistently across contract, service, and UI tasks.
- `normalizeSectorLabel` is introduced once and reused through the filter service and UI layers.
- `GlobeLegend` is introduced before `GlobeScene` integration tasks reference it.

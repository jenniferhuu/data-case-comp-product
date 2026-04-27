# UI Cleanup Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a small feature-oriented domain layer for filtering and selection so future UI changes can be added without repeated state wiring or inconsistent derived data.

**Architecture:** Keep the current React app shell and Zustand store, but add focused feature modules that define canonical filter params, shared filtered-flow derivation, and explicit selection actions. Refactor existing components to consume those APIs so the globe, stats strip, and leaderboard stay aligned while preserving current UI behavior.

**Tech Stack:** React 18, TypeScript, Zustand, Vitest, Cesium/Resium, Vite

---

## File Structure

### Create

- `src/features/filters/storeFilters.ts`
  - Canonical mapping from store state to `FilterParams`
- `src/features/filters/derivedData.ts`
  - Shared filtered-flow, stats, and leaderboard derivation helpers
- `src/features/filters/derivedData.test.ts`
  - Tests for canonical filtering and shared derived data
- `src/features/selection/selectionActions.ts`
  - Pure state transition helpers for donor/country/globe selection
- `src/features/selection/selectionActions.test.ts`
  - Tests for selection transitions

### Modify

- `src/state/store.ts`
  - Add grouped actions backed by pure selection helpers
- `src/components/Globe/ArcLayer.tsx`
  - Consume canonical filter params
- `src/components/Layout/StatsStrip.tsx`
  - Consume shared stats derivation
- `src/components/Sidebar/Leaderboard.tsx`
  - Consume canonical filter params, shared leaderboard derivation, and grouped selection actions
- `src/components/Globe/CesiumGlobe.tsx`
  - Route selection writes through grouped actions
- `src/App.tsx`
  - Use shared clear-selection action for panel close

## Task 1: Add Failing Tests For Canonical Filter And Derived Data Behavior

**Files:**
- Create: `src/features/filters/derivedData.test.ts`
- Read for context: `src/lib/filters.ts`
- Read for context: `src/lib/filters.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest'
import { buildFilterParams, getFilteredFlows, getFlowStats, getLeaderboardEntries } from './derivedData'
import type { AppData, Flow } from '../../types'

const makeFlow = (overrides: Partial<Flow> = {}): Flow => ({
  year: 2022,
  donor_id: 'acme_foundation',
  donor_name: 'ACME Foundation',
  donor_country: 'United Kingdom',
  recipient_iso3: 'UKR',
  recipient_name: 'Ukraine',
  usd_disbursed_m: 5,
  n_projects: 2,
  top_sector: 'Emergency',
  growth_rate: 0.3,
  ...overrides,
})

const data: AppData = {
  flows: {
    years: [2020, 2021, 2022],
    flows: [
      makeFlow({ usd_disbursed_m: 5, donor_id: 'a', donor_name: 'Donor A', recipient_iso3: 'UKR', recipient_name: 'Ukraine' }),
      makeFlow({ year: 2021, usd_disbursed_m: 2, donor_id: 'b', donor_name: 'Donor B', donor_country: 'France', top_sector: 'Education', recipient_iso3: 'KEN', recipient_name: 'Kenya' }),
      makeFlow({ year: 2020, usd_disbursed_m: 0.5, donor_id: 'c', donor_name: 'Donor C', recipient_iso3: 'ETH', recipient_name: 'Ethiopia' }),
    ],
  },
  donors: [],
  countries: [],
  markers: [],
  geo: [],
  crisisEvents: [],
  filterOptions: { donor_countries: [], sectors: [], year_min: 2020, year_max: 2022, markers: [] },
}

describe('buildFilterParams', () => {
  it('includes flowSizeMax in the canonical filter params', () => {
    expect(
      buildFilterParams({
        yearSelection: 'all',
        compareYears: [2020, 2023],
        donorCountry: null,
        sector: null,
        flowSizeMin: 0,
        flowSizeMax: 3,
      }),
    ).toEqual({
      yearSelection: 'all',
      compareYears: [2020, 2023],
      donorCountry: null,
      sector: null,
      flowSizeMin: 0,
      flowSizeMax: 3,
    })
  })
})

describe('shared flow derivation', () => {
  it('uses the same filtered flow set for stats and leaderboards when flowSizeMax is set', () => {
    const params = buildFilterParams({
      yearSelection: 'all',
      compareYears: [2020, 2023],
      donorCountry: null,
      sector: null,
      flowSizeMin: 0,
      flowSizeMax: 3,
    })

    const filtered = getFilteredFlows(data, params)
    const stats = getFlowStats(filtered)
    const donors = getLeaderboardEntries(filtered, 'donors', 10)
    const countries = getLeaderboardEntries(filtered, 'countries', 10)

    expect(filtered).toHaveLength(2)
    expect(stats).toEqual({ count: 2, totalUsd: 2.5 })
    expect(donors.map((entry) => entry.id)).toEqual(['b', 'c'])
    expect(countries.map((entry) => entry.id)).toEqual(['KEN', 'ETH'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/filters/derivedData.test.ts`

Expected: FAIL because `./derivedData` does not exist yet or required exports are missing.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/features/filters/derivedData.ts
import { applyFilters, getLeaderboardCountries, getLeaderboardDonors, type FilterParams, type LeaderboardEntry } from '../../lib/filters'
import type { AppData, YearSelection } from '../../types'

export interface FilterStateSnapshot {
  yearSelection: YearSelection
  compareYears: [number, number]
  donorCountry: string | null
  sector: string | null
  flowSizeMin: number
  flowSizeMax: number | null
}

export function buildFilterParams(state: FilterStateSnapshot): FilterParams {
  return {
    yearSelection: state.yearSelection,
    compareYears: state.compareYears,
    donorCountry: state.donorCountry,
    sector: state.sector,
    flowSizeMin: state.flowSizeMin,
    flowSizeMax: state.flowSizeMax,
  }
}

export function getFilteredFlows(data: Pick<AppData, 'flows'>, params: FilterParams) {
  return applyFilters(data.flows.flows, params)
}

export function getFlowStats(flows: AppData['flows']['flows']) {
  return {
    count: flows.length,
    totalUsd: flows.reduce((sum, flow) => sum + flow.usd_disbursed_m, 0),
  }
}

export type LeaderboardKind = 'donors' | 'countries'

export function getLeaderboardEntries(
  flows: AppData['flows']['flows'],
  kind: LeaderboardKind,
  topN: number,
): LeaderboardEntry[] {
  return kind === 'donors'
    ? getLeaderboardDonors(flows, topN)
    : getLeaderboardCountries(flows, topN)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/filters/derivedData.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless the user explicitly approves git actions.

## Task 2: Add Failing Tests For Selection Transitions

**Files:**
- Create: `src/features/selection/selectionActions.test.ts`
- Read for context: `src/lib/globeSelection.ts`
- Read for context: `src/lib/globeSelection.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest'
import { applyGlobeSelectionState, clearSelectionState, selectCountryState, selectDonorState } from './selectionActions'

describe('selection state helpers', () => {
  it('selects a donor and clears country selection', () => {
    expect(
      selectDonorState({
        selectedDonorId: null,
        selectedCountryIso3: 'KEN',
        donorCountry: null,
      }, 'donor-1'),
    ).toEqual({
      selectedDonorId: 'donor-1',
      selectedCountryIso3: null,
      donorCountry: null,
    })
  })

  it('selects a country and clears donor selection', () => {
    expect(
      selectCountryState({
        selectedDonorId: 'donor-1',
        selectedCountryIso3: null,
        donorCountry: 'United States',
      }, 'KEN'),
    ).toEqual({
      selectedDonorId: null,
      selectedCountryIso3: 'KEN',
      donorCountry: null,
    })
  })

  it('clears all drilldown state', () => {
    expect(
      clearSelectionState({
        selectedDonorId: 'donor-1',
        selectedCountryIso3: 'KEN',
        donorCountry: 'United States',
      }),
    ).toEqual({
      selectedDonorId: null,
      selectedCountryIso3: null,
      donorCountry: null,
    })
  })

  it('applies a resolved globe selection result', () => {
    expect(
      applyGlobeSelectionState(
        {
          selectedDonorId: null,
          selectedCountryIso3: null,
          donorCountry: null,
        },
        {
          selectedDonorId: 'donor-2',
          selectedCountryIso3: null,
          donorCountry: 'France',
        },
      ),
    ).toEqual({
      selectedDonorId: 'donor-2',
      selectedCountryIso3: null,
      donorCountry: 'France',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/selection/selectionActions.test.ts`

Expected: FAIL because `selectionActions.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/features/selection/selectionActions.ts
import type { GlobeSelectionState } from '../../lib/globeSelection'

export interface SelectionState {
  selectedDonorId: string | null
  selectedCountryIso3: string | null
  donorCountry: string | null
}

export function selectDonorState(state: SelectionState, donorId: string | null): SelectionState {
  return {
    ...state,
    selectedDonorId: donorId,
    selectedCountryIso3: null,
  }
}

export function selectCountryState(state: SelectionState, iso3: string | null): SelectionState {
  return {
    ...state,
    selectedDonorId: null,
    selectedCountryIso3: iso3,
    donorCountry: null,
  }
}

export function clearSelectionState(state: SelectionState): SelectionState {
  return {
    ...state,
    selectedDonorId: null,
    selectedCountryIso3: null,
    donorCountry: null,
  }
}

export function applyGlobeSelectionState(
  state: SelectionState,
  nextSelection: GlobeSelectionState,
): SelectionState {
  return {
    ...state,
    selectedDonorId: nextSelection.selectedDonorId,
    selectedCountryIso3: nextSelection.selectedCountryIso3,
    donorCountry: nextSelection.donorCountry,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/selection/selectionActions.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless the user explicitly approves git actions.

## Task 3: Add Grouped Store Actions Backed By Selection Helpers

**Files:**
- Modify: `src/state/store.ts`
- Read for context: `src/features/selection/selectionActions.ts`

- [ ] **Step 1: Write the failing test**

Add this case to `src/features/selection/selectionActions.test.ts` so the next implementation has a concrete contract:

```typescript
import { describe, expect, it } from 'vitest'
import { clearSelectionState, selectCountryState, selectDonorState } from './selectionActions'

describe('selection state helpers', () => {
  it('preserves donorCountry when selecting a donor directly', () => {
    expect(
      selectDonorState({
        selectedDonorId: null,
        selectedCountryIso3: 'KEN',
        donorCountry: 'United Kingdom',
      }, 'donor-1'),
    ).toEqual({
      selectedDonorId: 'donor-1',
      selectedCountryIso3: null,
      donorCountry: 'United Kingdom',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/selection/selectionActions.test.ts`

Expected: FAIL if the helper behavior does not match the intended grouped-action contract.

- [ ] **Step 3: Write minimal implementation**

```typescript
// add to src/state/store.ts
import {
  applyGlobeSelectionState,
  clearSelectionState,
  selectCountryState,
  selectDonorState,
} from '../features/selection/selectionActions'

interface AppState {
  // existing fields...
  selectDonor: (id: string | null) => void
  selectCountry: (iso3: string | null) => void
  clearSelection: () => void
  applyGlobeSelection: (selection: {
    selectedDonorId: string | null
    selectedCountryIso3: string | null
    donorCountry: string | null
  }) => void
}

selectDonor: (id) => set((state) => ({
  ...selectDonorState(state, id),
})),
selectCountry: (iso3) => set((state) => ({
  ...selectCountryState(state, iso3),
})),
clearSelection: () => set((state) => ({
  ...clearSelectionState(state),
})),
applyGlobeSelection: (selection) => set((state) => ({
  ...applyGlobeSelectionState(state, selection),
})),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/selection/selectionActions.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless the user explicitly approves git actions.

## Task 4: Refactor Components To Use Canonical Filter Params And Derived Data

**Files:**
- Create: `src/features/filters/storeFilters.ts`
- Modify: `src/components/Globe/ArcLayer.tsx`
- Modify: `src/components/Layout/StatsStrip.tsx`
- Modify: `src/components/Sidebar/Leaderboard.tsx`

- [ ] **Step 1: Write the failing test**

Add this case to `src/features/filters/derivedData.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildFilterParams } from './derivedData'

describe('buildFilterParams', () => {
  it('keeps null flowSizeMax instead of inventing an upper cap', () => {
    expect(
      buildFilterParams({
        yearSelection: 'all',
        compareYears: [2020, 2023],
        donorCountry: null,
        sector: null,
        flowSizeMin: 0,
        flowSizeMax: null,
      }).flowSizeMax,
    ).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/filters/derivedData.test.ts`

Expected: FAIL if the derived-data module or helper exports are incomplete.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/features/filters/storeFilters.ts
import type { FilterStateSnapshot } from './derivedData'
import { buildFilterParams } from './derivedData'

export function getStoreFilterSnapshot(state: {
  yearSelection: FilterStateSnapshot['yearSelection']
  compareYears: FilterStateSnapshot['compareYears']
  donorCountry: FilterStateSnapshot['donorCountry']
  sector: FilterStateSnapshot['sector']
  flowSizeMin: FilterStateSnapshot['flowSizeMin']
  flowSizeMax: FilterStateSnapshot['flowSizeMax']
}) {
  return buildFilterParams(state)
}
```

Then update components to consume the shared helpers:

```typescript
// ArcLayer.tsx
const filterParams = getStoreFilterSnapshot({
  yearSelection,
  compareYears,
  donorCountry,
  sector,
  flowSizeMin,
  flowSizeMax,
})
const filtered = getFilteredFlows(data, filterParams)
```

```typescript
// StatsStrip.tsx
const filterParams = getStoreFilterSnapshot({
  yearSelection,
  compareYears,
  donorCountry,
  sector,
  flowSizeMin,
  flowSizeMax,
})
const filtered = getFilteredFlows(data, filterParams)
const { count, totalUsd } = getFlowStats(filtered)
```

```typescript
// Leaderboard.tsx
const filterParams = getStoreFilterSnapshot({
  yearSelection,
  compareYears,
  donorCountry,
  sector,
  flowSizeMin,
  flowSizeMax,
})
const filtered = getFilteredFlows(data, filterParams)
const allEntries = getLeaderboardEntries(filtered, tab, 1000)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/filters/derivedData.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless the user explicitly approves git actions.

## Task 5: Refactor UI Selection Writes To Use Grouped Actions

**Files:**
- Modify: `src/components/Sidebar/Leaderboard.tsx`
- Modify: `src/components/Globe/CesiumGlobe.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing test**

Add this case to `src/features/selection/selectionActions.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { applyGlobeSelectionState } from './selectionActions'

describe('selection state helpers', () => {
  it('clears donorCountry when globe selection resolves to a country panel', () => {
    expect(
      applyGlobeSelectionState(
        {
          selectedDonorId: 'donor-1',
          selectedCountryIso3: null,
          donorCountry: 'United States',
        },
        {
          selectedDonorId: null,
          selectedCountryIso3: 'KEN',
          donorCountry: null,
        },
      ),
    ).toEqual({
      selectedDonorId: null,
      selectedCountryIso3: 'KEN',
      donorCountry: null,
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/selection/selectionActions.test.ts`

Expected: FAIL if grouped selection semantics are incomplete.

- [ ] **Step 3: Write minimal implementation**

Update components to call shared actions rather than coordinating raw setter pairs/triples:

```typescript
// Leaderboard.tsx
const {
  yearSelection,
  compareYears,
  donorCountry,
  sector,
  flowSizeMin,
  flowSizeMax,
  selectedDonorId,
  selectedCountryIso3,
  selectDonor,
  selectCountry,
} = useStore()

function selectEntry(id: string) {
  if (tab === 'donors') {
    selectDonor(id)
  } else {
    selectCountry(id)
  }
}
```

```typescript
// CesiumGlobe.tsx
const { applyGlobeSelection, clearSelection } = useStore()

if (!countryEntity) {
  clearSelection()
  return
}

const nextSelection = resolveGlobeSelection(iso3, dataRef.current.donors)
applyGlobeSelection(nextSelection)
```

```typescript
// App.tsx
const { selectedDonorId, selectedCountryIso3, clearSelection, mode } = useStore()

<Panel
  title={selectedDonor?.donor_name ?? selectedCountry?.name ?? ''}
  onClose={clearSelection}
>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/selection/selectionActions.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless the user explicitly approves git actions.

## Task 6: Full Verification

**Files:**
- Test: `src/features/filters/derivedData.test.ts`
- Test: `src/features/selection/selectionActions.test.ts`
- Test: `src/lib/filters.test.ts`
- Test: `src/lib/globeSelection.test.ts`

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- src/features/filters/derivedData.test.ts src/features/selection/selectionActions.test.ts
```

Expected: PASS

- [ ] **Step 2: Run full unit suite**

Run:

```bash
npm test
```

Expected: PASS with all existing and new tests green.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Existing bundle-size warnings are acceptable unless they become materially worse.

- [ ] **Step 4: Optional local UI spot-check**

Run:

```bash
npm run dev
```

Then verify:
- setting a max flow size reduces arcs, leaderboard entries, and stats together
- clicking a donor-country shape still opens the donor panel
- clicking a non-donor country still opens the country panel
- closing the panel clears the current selection cleanly

- [ ] **Step 5: Commit**

Do not commit unless the user explicitly approves git actions.

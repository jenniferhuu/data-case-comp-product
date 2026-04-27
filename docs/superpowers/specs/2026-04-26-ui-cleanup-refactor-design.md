# UI Cleanup Refactor Design

## Goal

Clean the codebase so future UI changes can be added with less coupling and less repeated state wiring, while preserving the current interface and behavior except for source-backed consistency fixes.

## Scope

This pass will:
- keep the existing app shell and visual structure
- keep Zustand as the app state store
- introduce a small feature-oriented domain layer for filtering, selection, and derived data
- refactor components to consume shared APIs instead of rebuilding raw store-driven logic locally
- fix the current inconsistency where `flowSizeMax` affects the globe but not the stats strip or leaderboard
- add focused unit tests for the new shared behavior

This pass will not:
- redesign the UI
- replace Cesium or Resium
- rewrite the store architecture from scratch
- broadly move all components into feature folders
- change compare-mode UX unless required by a failing test or obvious bug

## Current Problems

### Repeated Filter Assembly

Multiple components independently assemble filter params from store state:
- `src/components/Globe/ArcLayer.tsx`
- `src/components/Layout/StatsStrip.tsx`
- `src/components/Sidebar/Leaderboard.tsx`

Those implementations are already diverging. `ArcLayer` includes `flowSizeMax`, while `StatsStrip` and `Leaderboard` do not.

### Selection Logic Is Spread Across UI Components

Selection rules currently live in several places:
- `src/components/Globe/CesiumGlobe.tsx`
- `src/components/Sidebar/Leaderboard.tsx`
- `src/App.tsx`

Components manually clear sibling selection fields and mix filter updates with drilldown selection updates. That makes future UI work harder and increases regression risk.

### Derived Data Is Not Canonical

Filtered flows, totals, and leaderboard inputs are recomputed in multiple components with slightly different inputs. That creates drift between surfaces and makes behavior harder to reason about.

### The Store Has No Domain-Level Actions

`src/state/store.ts` is a flat field/setter store. It exposes raw mutation primitives but not app-level actions such as “select donor”, “clear selection”, or “apply globe click result”.

## Target Architecture

Keep `src/App.tsx` as the composition root and keep Zustand for state. Add a thin feature-oriented domain layer that sits between UI components and raw store fields.

### Feature Areas

#### `src/features/filters/`

Responsibility:
- define the canonical mapping from store state to `FilterParams`
- define shared filtered-flow and filter-derived computations

Planned contents:
- a selector/helper that converts current store state into a single `FilterParams` object
- a shared helper for deriving filtered flows from `AppData`
- reusable helpers for stats and leaderboard inputs sourced from the same filtered set

This becomes the only place where current filter state is translated into `applyFilters(...)` input.

#### `src/features/selection/`

Responsibility:
- define explicit selection actions and selection rules
- prevent components from orchestrating multi-field updates manually

Planned contents:
- donor selection action
- country selection action
- clear selection action
- globe selection application action
- pure selection helpers reused by both state actions and tests

This area may reuse pure logic from `src/lib/globeSelection.ts` or absorb that logic if doing so keeps the boundary cleaner.

#### Derived Data

Responsibility:
- expose shared computations for:
  - filtered flows
  - total USD / count
  - leaderboard inputs

This logic should be shared so the globe, sidebar, and stats strip stay aligned.

## Store Changes

Keep the existing state fields in `src/state/store.ts`, but extend the store with grouped actions instead of replacing the current model.

### Preserve Existing State

Retain:
- `mode`
- `yearSelection`
- `compareYears`
- `donorCountry`
- `sector`
- `flowSizeMin`
- `flowSizeMax`
- `selectedMarker`
- `selectedDonorId`
- `selectedCountryIso3`

### Add Domain-Level Actions

Add actions such as:
- `selectDonor(donorId: string | null)`
- `selectCountry(iso3: string | null)`
- `clearSelection()`
- `applyGlobeSelection(selectionResult)`

These actions will own cross-field updates so components stop directly coordinating sibling fields.

### Store Boundary Rule

UI components may still read store fields, but cross-field write behavior should go through grouped actions, not repeated inline setter sequences.

## Component Refactor Plan

### `src/components/Globe/ArcLayer.tsx`

Refactor to use canonical filtered data inputs from the filters feature instead of building filter params inline.

This keeps rendering logic in `ArcLayer`, but moves filter-state interpretation out of the component.

### `src/components/Layout/StatsStrip.tsx`

Refactor to consume shared derived stats based on the canonical filtered-flow path.

This intentionally fixes the current bug where `flowSizeMax` is ignored.

### `src/components/Sidebar/Leaderboard.tsx`

Refactor to consume canonical filtered flows and shared leaderboard derivation. Selection writes should go through grouped selection actions rather than direct sibling-field mutation.

The local tab state may remain local in this pass, but it should stop owning selection consistency behavior.

### `src/components/Globe/CesiumGlobe.tsx`

Keep the Cesium lifecycle and rendering structure intact. Refactor selection writes to go through grouped actions. Continue using pure globe-selection helpers for click resolution.

This pass will clean the data and action inputs around Cesium, not re-architect Cesium itself.

### `src/App.tsx`

Reduce panel-close behavior to shared selection actions instead of direct raw setter coordination.

## Testing Strategy

Tests must be written before the corresponding production refactor work.

### New Tests

Add focused unit tests for:
- canonical filter param construction, including `flowSizeMax`
- derived filtered-flow stats and leaderboard inputs
- selection actions and globe selection application behavior

### Existing Tests

Keep green:
- `src/lib/filters.test.ts`
- `src/lib/globeSelection.test.ts`

If low-level pure helpers move or are wrapped, preserve equivalent coverage.

### Verification

Required verification before completion:
- targeted unit tests for new feature modules
- full `npm test`
- `npm run build`

Optional if needed:
- local render and spot-check of key interactions

## Behavior Guarantees

This cleanup pass preserves existing UI behavior except for intentional consistency fixes.

### Preserved

- current layout and component structure
- current donor/country panel behavior
- current compare mode semantics
- current Cesium rendering approach

### Intentionally Fixed

- `flowSizeMax` must affect all major data displays consistently:
  - globe arcs
  - stats strip
  - leaderboard

## Risks And Mitigations

### Risk: Refactor Introduces Behavior Drift

Mitigation:
- use test-first coverage around the new domain layer
- preserve current component responsibilities where possible
- avoid changing visual structure during cleanup

### Risk: Selection Rules Become Harder To Trace

Mitigation:
- centralize all cross-field selection writes behind explicit actions
- keep pure selection helpers small and directly tested

### Risk: Over-Refactoring

Mitigation:
- do not move to a full feature-folder UI rewrite
- do not replace Zustand
- do not redesign compare mode in the cleanup pass

## Success Criteria

The refactor is successful when:
- the globe, stats strip, and leaderboard use one canonical filtered-flow path
- selection updates no longer depend on repeated inline setter sequences in UI components
- future UI work can extend filtering or selection behavior by editing focused feature modules instead of several unrelated components
- tests and production build both pass

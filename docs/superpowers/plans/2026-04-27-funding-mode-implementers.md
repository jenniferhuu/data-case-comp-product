# Funding Mode, Implementers, and Modality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a global commitments/disbursements toggle, add implementer rankings to drilldowns, add a grants-vs-loans overview donut, and make overview geography follow donor and donor-country filters.

**Architecture:** Move the server aggregation path onto shared normalized funding rows so overview, globe, and drilldown all filter and aggregate from the same dataset. Thread a new `valueMode` query field through dashboard state and UI, then extend right-rail contracts and rendering to expose modality and implementer analytics.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zustand, Vitest, Zod

---

### Task 1: Query and Contract Plumbing

**Files:**
- Modify: `src/contracts/filters.ts`
- Modify: `src/features/dashboard/queryState.ts`
- Modify: `src/features/dashboard/useDashboardState.ts`
- Modify: `src/contracts/overview.ts`
- Modify: `src/contracts/drilldown.ts`
- Test: `tests/server/dashboard-shell.test.tsx`
- Test: `tests/server/contracts.test.ts`

- [ ] Add failing tests for `valueMode` parsing and serialization.
- [ ] Add failing contract tests for `modalityBreakdown` and `topImplementers`.
- [ ] Implement the new query field and contract shapes.
- [ ] Re-run targeted tests and confirm green.

### Task 2: Shared Row Aggregation

**Files:**
- Modify: `src/pipeline/normalize/normalizeRows.ts`
- Add: `src/server/repositories/fundingRowsRepository.ts`
- Add: `src/server/services/dashboardData.ts`
- Modify: `src/server/services/overviewService.ts`
- Modify: `src/server/services/globeService.ts`
- Modify: `src/server/services/drilldownService.ts`
- Modify: `src/app/api/overview/route.ts`
- Test: `tests/server/services.test.ts`
- Test: `tests/server/drilldown-service-expanded.test.ts`
- Test: `tests/server/api.test.ts`

- [ ] Write failing service tests for commitments mode, donor/donor-country filtered overview, modality breakdown, and implementer rankings.
- [ ] Add shared normalized-row loading plus helpers for active amount, financial instrument classification, and query filtering.
- [ ] Update overview, globe, and drilldown services to use shared helpers and request search params.
- [ ] Re-run targeted service and API tests until green.

### Task 3: Dashboard UI and Right Rail Rendering

**Files:**
- Modify: `src/components/dashboard/DashboardShell.tsx`
- Modify: `src/components/dashboard/ControlRail.tsx`
- Modify: `src/components/dashboard/InsightRail.tsx`
- Modify: `src/components/panels/DonorDrilldown.tsx`
- Modify: `src/components/panels/CountryDrilldown.tsx`
- Modify: `src/components/panels/DonorCountryDrilldown.tsx`
- Test: `tests/server/control-rail.test.tsx`
- Test: `tests/server/drilldown.test.tsx`
- Test: `tests/server/insight-rail-expanded.test.tsx`

- [ ] Add failing UI tests for the top value toggle, modality donut, implementer lists, and geography card visibility under donor filters.
- [ ] Implement the new top toggle and wire overview fetches to query state.
- [ ] Render modality and implementer analytics and neutralize copy that assumes disbursements.
- [ ] Re-run targeted UI tests until green.

### Task 4: Verification

**Files:**
- No code changes expected unless verification exposes gaps.

- [ ] Run the targeted Vitest commands covering contracts, services, control rail, drilldown, and insight rail.
- [ ] Run a broader regression pass over `npm test -- --runInBand` or the repo’s equivalent targeted suite if full run is too slow.
- [ ] Review the diff for accidental scope creep and summarize residual risk if any.

# Funding Mode, Implementers, and Modality Design

Date: 2026-04-27

## Goal

Add three high-value analytics features to the dashboard:

1. A global `Disbursements | Commitments` toggle that changes the measure driving all aggregated numbers.
2. Top implementer breakdowns based on `channel_name` in drilldown views.
3. A `Grants vs loans` overview donut based on `financial_instrument`.

Also fix the flow geography percentage breakdown so it appears and updates whenever a donor country or donor is selected from the control rail, as long as the right rail is still in overview mode rather than a donor/country drilldown.

## Current State

- Query state drives `/api/globe` and `/api/drilldown`.
- `/api/overview` is effectively global-only and does not currently follow the active filter/query state.
- The normalized funding row keeps one amount field, `amountUsdM`, sourced from disbursements.
- Drilldowns expose sector and counterparty rankings, but not implementers.
- Overview state in the right rail shows top sectors, top recipients, top donors, and yearly distribution.

This means a commitments toggle cannot be implemented correctly by changing UI labels only. The server-side aggregation path has to support measure selection, and overview data has to become filter-aware so the right rail stays consistent with the active globe filter state.

## Design Summary

Use one source of truth: add a `valueMode` query parameter with values `disbursements` and `commitments`, defaulting to `disbursements`, and thread it through the existing server-side data services. Aggregate overview, globe, and drilldown responses from the same filtered rows using the measure selected by `valueMode`.

## Data Model Changes

### Canonical rows

Extend `CanonicalFundingRow` to retain the raw dimensions needed for these features:

- `disbursementsUsdM`
- `commitmentsUsdM`
- `channelName`
- `financialInstrument`

`amountUsdM` should be removed or replaced by an explicit helper-based access pattern so the active measure is selected deliberately rather than implicitly.

### Normalization rules

- `disbursementsUsdM` comes from `usd_disbursed`, `usd_disbursed_m`, or `usd_disbursements_defl`, following the current fallback order.
- `commitmentsUsdM` comes from `usd_commitment_defl`.
- `channelName` comes from `channel_name`, trimmed; blank values normalize to `Direct / unspecified`.
- `financialInstrument` comes from `financial_instrument`, trimmed.

### Derived classifications

Define a small helper that maps `financial_instrument` into:

- `grant`
- `loan`
- `unknown`

The overview donut should display only `Grants` and `Loans`. `Unknown` can be omitted when zero; if non-zero, it can be folded into `Grants` only if the dataset proves that blank values overwhelmingly mean grants. To avoid hidden assumptions, the default implementation should keep a third bucket internally and only expose the two requested categories by matching known loan terms and treating all other known non-loan values as grants.

The exact heuristic:

- If normalized text contains `loan`, classify as `loan`.
- Otherwise, if text is non-empty, classify as `grant`.
- If blank after normalization, classify as `grant` for the v1 donut so the chart remains exhaustive and simple.

This keeps the feature aligned with the user request while avoiding a partially summed donut.

## Query and State Changes

Add `valueMode` to `DashboardQuery`:

- `disbursements`
- `commitments`

Default: `disbursements`

Thread `valueMode` through:

- `dashboardQuerySchema`
- `parseDashboardQuery`
- `mergeDashboardQuery`
- `createDashboardSearchParams`
- Zustand dashboard state in `useDashboardState`

The top control in the left rail becomes the source for this value. It should not maintain local-only state.

## Server Aggregation Strategy

Create or reuse shared filtering logic so `overview`, `globe`, and `drilldown` all work from the same filtered row subset and same active measure.

### Shared helpers

Introduce a server-side helper layer that:

- reads normalized or artifact-backed rows containing both amounts and the new dimensions
- filters rows using current dashboard query fields
- resolves the active amount for a row from `valueMode`

The filtering rules should match current behavior:

- year mode: all, single, compare
- donor
- donor country
- recipient country
- sector

Selection state should continue to control drilldown payload selection, not the base filter subset.

### Overview service

Change `/api/overview` to accept current query params and compute:

- totals using the active amount
- top sectors
- top recipients
- top donors
- yearly funding
- modality breakdown for the donut

The overview response should reflect donor and donor-country filters, so when a user picks a donor country or donor from the control rail without opening a right-rail entity drilldown, all overview visuals remain coherent.

### Globe service

Change globe aggregation to use the active amount field so:

- visible funding
- arc magnitudes
- point totals
- cross-border vs domestic percentages

all reflect the selected measure.

This ensures the geography breakdown changes with the commitments toggle and with any applicable donor/donor-country filters.

### Drilldown service

Change drilldown aggregation to use the active amount field and add implementer rankings:

- donor drilldown: ranked implementers receiving that donor’s funds
- country drilldown: ranked implementers active in that recipient country
- donor-country drilldown: ranked implementers across donors from that donor country

Retain existing sector, yearly, and counterparty breakdowns.

## API Contract Changes

### Dashboard query

Add:

- `valueMode?: 'disbursements' | 'commitments'`

### Overview response

Add a modality section, for example:

- `modalityBreakdown: Array<{ label: string; totalUsdM: number }>`

This will drive the `Grants vs loans` donut.

### Drilldown response

Add an implementer list shape that all drilldowns can reuse, for example:

- `topImplementers: Array<{ name: string; totalUsdM: number }>`

This should be added to:

- donor drilldown
- country drilldown
- donor-country drilldown

## UI Changes

### Control rail

Add a segmented control near the top of the left rail:

- `Disbursements`
- `Commitments`

Behavior:

- updates `valueMode` in shared dashboard state
- updates URL/query synchronization through existing query helpers
- triggers all dependent fetches through existing reactive paths

### Insight rail overview state

When no donor/country/donor-country drilldown is active:

- keep current overview cards and ranked lists
- show `Flow geography` whenever globe stats are available
- add a compact `Grants vs loans` donut driven by `modalityBreakdown`

The geography card should not disappear just because the user selected a donor or donor country in the control rail. It should be tied to overview mode, not to “no filters at all”.

### Drilldown panels

Add a new ranked list titled `Top implementers` to:

- donor drilldown
- country drilldown
- donor-country drilldown

Placement:

- after sector mix
- before yearly trend

This places “who executes the money” alongside “what sector it supports” and “who receives it”.

### Copy adjustments

Current labels such as `Total disclosed funding` imply disbursements. Replace explicit disbursement wording with neutral copy such as:

- `Tracked funding`
- `Active funding base`

The numbers remain measure-dependent, but the labels do not have to change when toggling modes.

## Error Handling and Edge Cases

- If commitment amounts are missing for some rows, normalize them to `0`.
- If `channel_name` is blank, use `Direct / unspecified`.
- If a filtered subset has zero loan volume, the donut can show a single full grant segment.
- If a filtered subset has zero total active amount, all rankings and charts should degrade to empty arrays rather than error.
- Compare mode should continue to include both selected years in the filtered set; totals and rankings are based on the sum across those included years unless a component explicitly visualizes yearly separation.

## Testing Strategy

Add test coverage before implementation for:

1. Query state:
   - parses and serializes `valueMode`
   - merge behavior preserves and updates `valueMode`

2. Control rail:
   - renders the commitments/disbursements segmented control
   - updates shared state when toggled

3. Overview service:
   - donor and donor-country filters affect overview aggregates
   - `valueMode=commitments` changes totals relative to disbursements
   - modality breakdown returns expected grants vs loans values

4. Globe service:
   - visible funding and cross-border/domestic percentages follow active filters and `valueMode`

5. Drilldown service:
   - donor, country, and donor-country drilldowns expose `topImplementers`
   - totals and yearly distributions switch correctly between disbursements and commitments

6. UI rendering:
   - insight rail overview shows modality donut
   - geography card renders during donor-filtered and donor-country-filtered overview states
   - drilldown views render the implementer list

## Implementation Boundaries

This design intentionally does not introduce:

- a separate client-only aggregation path
- duplicate “commitments artifacts” and “disbursements artifacts” contracts when one dual-measure model is sufficient
- a new drilldown mode beyond donor, country, and donor-country
- modality breakdowns in drilldown panels

The scope stays focused on the requested features and the one related bug fix.

## Acceptance Criteria

- Toggling `Disbursements | Commitments` changes all visible aggregated amounts consistently across hero, globe, overview rail, and drilldowns.
- Donor, country, and donor-country drilldowns each show a `Top implementers` ranked list sourced from `channel_name`.
- The overview rail shows a `Grants vs loans` donut sourced from `financial_instrument`.
- The flow geography percentage breakdown appears and updates in overview mode even when donor or donor-country filters are active.
- Existing year, sector, donor, donor-country, and recipient filters continue to work without invalid query state transitions.

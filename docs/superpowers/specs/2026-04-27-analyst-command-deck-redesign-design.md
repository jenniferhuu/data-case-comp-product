# Analyst Command Deck Redesign

Date: 2026-04-27
Project: `philanthroglobe`
Status: Draft approved in conversation, written for final user review before planning

## Goal

Upgrade the dashboard into a premium analyst command deck that:

- removes layout overlap and visual crowding
- makes money-flow arcs easier to read
- explains visual encodings with explicit legends
- turns the right rail into a stacked analytical inspector
- supports first-class country selection from the globe
- adds polish that improves clarity, perceived quality, and judge-readiness without changing the product’s core interaction model

## Chosen Direction

The redesign will follow the approved `A` direction: a denser, instrument-like analyst surface rather than a spacious executive poster layout.

The right rail will follow the approved `stacked analysis` model rather than tabs. All major analytical sections remain visible in one vertically scrollable inspector.

## Product Intent

The dashboard should feel like a live geopolitical funding instrument:

- central globe as the primary exploration surface
- disciplined side rails that frame, not compete with, the globe
- compact but premium information density
- explicit visual language so a judge can understand color, size, and selection state quickly

The redesign should preserve the current strengths:

- globe-first exploration
- ambient premium atmosphere
- donor and country drilldown model
- low-friction filter workflow

## Visual Thesis

Mood: dark orbital command deck with disciplined glass, cool cyan guidance, restrained amber emphasis, and denser analytical surfaces.

Material: soft translucent panels, thinner chrome, tighter spacing, fewer oversized cards, more precise typography.

Energy: active and credible, not flashy. Motion should suggest live telemetry rather than decorative animation.

## Scope

### In Scope

- shell layout tightening and overlap reduction
- globe overlay resizing and repositioning
- clearer arc styling and scaling
- on-globe legends for arc color, arc size, and point color/size
- right-rail redesign into stacked analytical sections
- richer drilldown payloads for donors and countries
- country selection from the globe as a primary drilldown path
- premium polish to spacing, labels, empty states, loading states, and transitions

### Out of Scope

- a new data source or a pipeline rewrite
- user-authored annotations
- crossfilter interactions between charts and the globe beyond selection state
- a full charting framework migration
- a second drawer, modal, or tabbed inspector architecture

## Information Architecture

### Global Shell

The page remains a three-column structure on desktop:

- left rail: controls and explanatory filter context
- center stage: globe plus compact overlays and legends
- right rail: stacked analytical inspector

The key change is hierarchy:

- the left rail becomes narrower and calmer
- the hero header becomes shorter and less dominant
- the floating KPI strip becomes slimmer
- the bottom-left context card becomes smaller and more anchored
- the right rail becomes more useful and denser

On mobile and narrower laptop widths:

- left and right rails collapse into stacked sections above/below the globe
- globe overlays must scale down and avoid obscuring the canvas
- the inspector remains scrollable and readable without horizontal overflow

## Layout Design

### Left Rail

The control rail should:

- shrink in width relative to the current desktop layout
- group controls into tighter vertical blocks
- avoid oversized rounded containers for every element
- keep selection status and explanatory guidance, but with less visual weight

Structure:

1. rail heading
2. view mode controls
3. filter controls
4. reset action
5. active selection status
6. short compare-mode guidance

### Center Globe Stage

The globe remains the main visual anchor. Changes:

- top stats bar becomes shorter and more compact
- legend cluster appears near the lower-right or lower-center of the globe stage
- bottom-left descriptive card becomes smaller and less tall
- top hero container is visually lighter and consumes less vertical space
- visual breathing room around the globe increases by shrinking chrome, not by shrinking the globe itself

### Right Rail

The right rail becomes a stacked analysis inspector. It must always have meaningful content:

- idle state: platform overview analytics
- donor selection: donor-centric breakdowns
- country selection: country-centric breakdowns

The rail should no longer feel like a shallow text summary. It becomes a sequence of compact analytical modules.

## Globe Interaction Design

### Selection Model

Selection remains mutually exclusive:

- clicking an arc selects a donor
- clicking a point selects a country
- clicking a country on the globe surface also selects a country
- only one selected entity is active at a time

Selection state should be reflected in:

- right rail header
- globe overlay copy
- selected arc or point emphasis
- country highlight, if country polygons are available in the current globe implementation

### Arc Cleanup

The current arc treatment is too visually noisy. The redesign will improve readability by:

- reducing the dominance of low-value corridors
- using clearer size buckets for funding magnitude
- softening the default alpha of non-selected corridors
- emphasizing hovered/selected corridors more clearly than the base set
- making compare-mode color logic easier to interpret

Recommended visual encoding:

- default mode:
  - arc color represents sector
  - arc width represents funding volume
  - arc alpha remains subdued for non-selected corridors
- compare mode:
  - arc color switches from sector hues to a delta palette
  - positive change uses a red-to-green spectrum centered on neutral for low change
  - negative change uses the opposite end of the same spectrum
  - arc width continues to represent absolute visible volume, not delta magnitude

Arc width should remain tied to funding size, but with less aggressive spread so many medium arcs do not visually overpower the globe.

Sector hues should come from a compact stable palette rather than many unrelated colors. Similar sectors should not collapse into visually indistinguishable shades, and `Other` should use a deliberately muted fallback.

Compare mode should be explicitly framed as a mode switch:

- standard exploration mode: sector-colored flows
- compare mode: delta-colored flows across a selected time period

The legend and supporting copy must make this switch obvious.

### Point Cleanup

Recipient nodes should be more legible as selectable anchors:

- slightly more disciplined radius progression
- clearer color progression by total visible funding
- stronger hover and selected-state distinction

### Legends

Add an always-visible legend block in the globe stage explaining:

- arc color meaning
- arc thickness meaning
- point size or intensity meaning
- compare-mode color behavior when compare mode is active

Legend copy must be short and operational, not marketing copy.

In standard mode, the legend must show sector color chips with readable sector names.

In compare mode, the legend must switch to a delta explanation that makes the red/green spectrum and neutral midpoint immediately clear.

## Sector Label Normalization

The UI must not expose numeric sector codes or raw concatenated code strings to the user.

Requirements:

- sector filters use human-readable sector names
- legends use human-readable sector names
- drilldown charts use human-readable sector names
- any raw coded sector values are normalized before rendering

Implementation should prefer a single shared normalization layer rather than ad hoc formatting in individual components.

If source data contains malformed multi-code sector strings, the UI should map them into a stable fallback bucket such as `Multi-sector` or `Other`, not show the raw coded string to the user.

## Right Rail Analytical Sections

The stacked inspector should be assembled from reusable sections.

### Shared Structure

Each state starts with:

1. identity header
2. funding summary card
3. stacked chart modules

Each chart module should have:

- small eyebrow/label
- short title
- one-line supporting copy only if necessary
- compact visual rendering

### Idle Overview State

When nothing is selected, the right rail should show:

- platform funding total
- top sectors distribution
- top recipient countries
- top donor countries or donors
- yearly distribution trend

Purpose:

- give the user meaningful context before any drilldown
- show that the rail is an analysis surface, not just a detail pane

### Donor State

When a donor is selected, the rail should show:

- donor identity and home market
- total disclosed funding
- sector distribution for that donor
- top recipient countries for that donor
- yearly funding trend for that donor
- concentration summary, such as top recipient share or corridor concentration

### Country State

When a country is selected, the rail should show:

- country identity and ISO3
- total received funding
- top incoming sectors
- top donor sources
- yearly incoming funding trend
- concentration summary, such as top donor share

## Data Contract Changes

The current drilldown contract is too thin. It only includes name and funding total. The API contract must be expanded so the right rail can render actual breakdowns.

### New Drilldown Shape

Keep the top-level `donor` or `country` split, but enrich each object with:

- summary totals
- yearly distribution array
- sector distribution array
- counterparties array
- concentration metrics

Suggested donor additions:

- `yearlyFunding: Array<{ year, totalUsdM }>`
- `sectorBreakdown: Array<{ sector, totalUsdM }>`
- `topRecipients: Array<{ iso3, name, totalUsdM }>`
- `recipientCount`
- `topRecipientShare`

Suggested country additions:

- `yearlyFunding: Array<{ year, totalUsdM }>`
- `sectorBreakdown: Array<{ sector, totalUsdM }>`
- `topDonors: Array<{ id, name, country, totalUsdM }>`
- `donorCount`
- `topDonorShare`

### Overview Contract

The overview payload may also need enrichment for idle-state charts. If the current overview endpoint is too thin, either:

- extend the overview contract with lightweight distributions, or
- add a dedicated overview-analysis payload sourced from generated artifacts

Preferred approach:

- extend or add one small server-side payload rather than deriving everything client-side from large raw data
- expose normalized sector labels from the server-side contract where practical so the client does not have to infer display names from raw numeric codes

## Component Design

### Components to Update

- `DashboardShell`
- `HeroStats`
- `ControlRail`
- `GlobeScene`
- `InsightRail`
- `CountryDrilldown`
- `DonorDrilldown`

### Components to Add

Recommended new focused components:

- `GlobeLegend`
- `InsightHeader`
- `InsightMetricCard`
- `InsightBarChart`
- `InsightTrendChart`
- `InsightRankList`
- `InsightEmptyState`

These should be small and composable rather than making `InsightRail` a monolith.

## Charting Approach

Charts should be compact and consistent:

- horizontal bar charts for sectors and top counterparties
- a small area or bar trend for year-by-year distribution
- metric chips or small cards for concentration metrics

The style should prioritize:

- high legibility in a dark UI
- minimal gridline noise
- no rainbow palette
- consistent numeric formatting

Use the existing charting library if it can support these compact visuals cleanly. Avoid introducing a new charting system unless blocked.

## Premium Polish Additions

Beyond the explicit request, the redesign should include:

- more disciplined type scale, especially smaller labels and tighter headers
- fewer large-radius oversized cards
- better numeric hierarchy so money values stand out first
- explicit empty-state language for idle rail, failed API loads, and zero-result filters
- better loading continuity between selection changes
- subtle entrance or crossfade motion for rail content changes
- a more coherent accent system so cyan is guidance and amber is emphasis, not random decoration
- improved button and select states so controls feel intentional rather than generic
- more informative compare-mode messaging so the switch from sector view to delta view feels deliberate, not surprising

## Error and Empty States

The UI should no longer silently degrade.

- filter failures should show an inline unavailable state
- globe failures should show an on-stage unavailable state
- drilldown failures should show a visible rail state, not disappear silently
- zero-result filters should produce a calm “no visible corridors” state with guidance to widen filters

## Performance Constraints

The redesign must not make the globe feel sluggish.

Requirements:

- keep overlay count disciplined
- avoid excessive chart re-renders on hover
- derive compact drilldown datasets server-side where practical
- keep stacked rail modules lightweight
- preserve acceptable load time on the first dashboard render

## Testing Strategy

Add or update tests for:

- control rail layout states and failure states
- globe failure-state messaging
- country selection behavior from point and country interactions
- expanded drilldown contract parsing and routing
- right-rail idle/donor/country render states
- zero-result filter state
- sector-label normalization in filters and legends
- compare-mode legend and delta-color state behavior

Visual validation should include:

- desktop readability
- laptop-width overlap checks
- mobile stacking behavior
- selected donor and selected country flows

## Recommended Implementation Order

1. extend contracts and server-side drilldown/overview analysis payloads
2. build reusable analytical rail components
3. redesign the right rail around stacked modules
4. tighten shell layout and resize globe overlays
5. add legend system and arc/point visual cleanup
6. wire country selection cleanly through the globe and inspector
7. apply final polish to motion, spacing, states, and typography

## Success Criteria

The redesign is successful if:

- no major overlay collisions remain at standard laptop widths
- arc readability improves at first glance
- users can explain what arc color and point emphasis mean without guessing
- country selection is as discoverable and useful as donor selection
- the right rail contains enough analytical depth to justify its width
- the page feels more premium, denser, and more intentional without becoming noisy

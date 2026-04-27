# Dashboard Platform Rebuild Design

## Goal

Rebuild the project as a deployable React/TypeScript product with a premium globe-first BI experience, a clean backend-for-frontend layer, and a data pipeline that can scale from hackathon judging on Vercel to richer analytics and database-backed querying later.

## Product Intent

This is not a single-purpose chart page or a one-off demo. It is a command center for policymakers and philanthropists that helps users understand where money is going, who is funding it, and how those patterns shift over time.

The product needs two qualities at once:
- an immediate visual wow factor for judges and first-time viewers
- a credible analyst workflow once users begin interacting

The globe is the centerpiece. The dashboard exists to deepen and explain what the globe is showing rather than competing with it.

## Scope

This rebuild will:
- move the project to a Next.js + React + TypeScript application structure
- introduce a typed API/backend-for-frontend layer
- add a pipeline that converts the primary CSV and allowed secondary enrichment data into analytics-ready artifacts
- redesign the information architecture aggressively around a premium hybrid globe + BI dashboard
- preserve the current domain concepts such as flows, donors, countries, sectors, years, and credibility-style markers
- target dependable Vercel deployment for hackathon judging

This rebuild will not:
- require a live production database in the first shipped version
- attempt to build a fully general analytics platform before the first demo
- allow secondary data to overshadow the primary competition dataset
- keep the current visual design or current component architecture intact by default

## Recommended Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS or an equivalent design-token-friendly styling layer
- `react-globe.gl` for the globe centerpiece
- a charting library for supporting dashboard surfaces

### Backend

- Next.js route handlers or server functions as the backend-for-frontend layer
- shared schemas and typed contracts between server and client
- data services that read generated artifacts in v1 and can later switch to database-backed implementations

### Data Pipeline

- a pipeline folder dedicated to ingest, normalization, validation, enrichment, and derived dataset generation
- build-time or predeploy generation of app-ready artifacts

## Why This Architecture

Three architectural approaches were considered.

### 1. Next.js + React + TypeScript + API routes/BFF

Pros:
- best fit for Vercel deployment
- clean client/server split without managing two separate apps
- strong long-term foundation for typed APIs, caching, auth, and future database access
- works well with a globe-heavy client UI as long as rendering stays in explicit client components

Cons:
- a larger rebuild than incrementally evolving the current Vite structure
- requires deliberate server/client boundaries for globe rendering

### 2. Vite frontend + separate Node API service

Pros:
- explicit frontend/backend separation
- backend can scale independently later

Cons:
- more deployment overhead for a hackathon
- weaker fit for a single smooth Vercel deployment
- more operational surface than necessary for v1

### 3. Static SPA with generated JSON only

Pros:
- fastest to ship
- lowest operational risk

Cons:
- too demo-oriented
- weak foundation for future query complexity, API evolution, or database migration

### Recommendation

Use approach 1. It gives the best mix of presentation quality, deployment simplicity, and future extensibility.

## Experience Design

## Hybrid Interaction Model

The app should open in an idle cinematic state. The globe should feel alive even before user interaction through restrained camera motion, animated arcs, atmospheric lighting, and carefully selected headline insights. The opening state should communicate scale and urgency without looking like a game or a default 3D sample.

After the first meaningful interaction, the app should transition into a denser BI workspace. That workspace should retain visual polish, but prioritize clarity, drilldown depth, and trust. The product should feel like one system changing modes, not a landing page handing off to a different tool.

## Globe-First Command Center

The globe remains the visual anchor. It should support:
- animated funding arcs between donors and recipient countries
- hover states for fast inspection
- click states for persistent drilldown
- smooth camera movement between major selections
- popups or side-panel drilldowns sourced from globe interaction
- mode-specific overlays such as sectors, trends, or credibility markers

The surrounding interface should support the globe, not bury it. A user should always understand what the selected region, donor, corridor, or time comparison means without leaving the main view.

## Information Architecture

The product should behave like a single command center organized around three decision questions:
- where funding is flowing
- which donors matter most in the current context
- how patterns change over time

These questions are equal in business importance, but they should be answered through a shared selection context rather than separate disconnected pages.

## Layout Direction

Recommended layout:
- center: large interactive globe
- left rail: control surface for filters, mode switching, and presets
- right rail: insight surface for rankings, summaries, and selected-entity drilldowns
- top or upper overlay: hero metrics or key narrative cards
- lower supporting region or expandable drawers: time-series and compare views

The visual style should feel premium and editorial rather than generic SaaS. Strong typography, deliberate spacing, atmosphere, and motion are required. The UI should avoid a cluttered control wall.

## Core Feature Set

## Globe Interactions

The globe should be rebuilt around `react-globe.gl` and serve as the primary interaction surface.

Required globe capabilities:
- animated arcs showing donor-to-country flows
- selectable countries and donor-linked corridors
- tooltip and drilldown behavior that can open either lightweight popups or richer side panels
- programmatic camera control for focus transitions
- mode-aware rendering so the same globe supports crisis, funding, trend, and credibility-oriented views

## BI Dashboard Surfaces

The dashboard should expose supporting analytical surfaces tied to the current selection context:
- ranked donors
- ranked recipient countries
- top corridors
- funding totals and share metrics
- trend change and year-over-year comparisons
- sector mix
- marker or credibility breakdowns

These surfaces should not compute their own raw logic independently in the browser. They should consume stable backend view models.

## Preset Narratives

Because this is also a judged experience, the app should support a few curated story states or presets:
- global overview
- major crisis spotlight
- donor spotlight
- trend comparison spotlight

These presets should help the presenter trigger compelling views quickly without sacrificing free exploration.

## Data and Backend Design

## Source of Truth

The primary CSV is the source of truth. The `data dictionary.md` file defines semantics that the ingest layer must respect. External data is allowed, but must remain secondary and clearly bounded so it enriches the experience without overwhelming the main dataset.

## Data Pipeline Stages

The pipeline should separate concerns into explicit stages:

### Ingest

Responsibilities:
- load the primary CSV
- load approved enrichment files
- validate required columns and basic shape
- fail loudly if expected fields are missing or malformed

### Normalize

Responsibilities:
- clean names and identifiers
- resolve canonical country and donor keys
- map raw values to canonical enums or categories where needed
- normalize years, currencies, sectors, and marker dimensions

### Derive

Responsibilities:
- compute app-ready aggregates and corridor tables
- build yearly summaries
- build donor and country rollups
- build precomputed leaderboard and comparison inputs where useful
- prepare globe geometry-ready or visualization-ready datasets

### Publish

Responsibilities:
- write generated artifacts into a versioned output area
- expose stable artifact names that the server layer can read
- make local build and Vercel deployment deterministic

## Backend-for-Frontend Layer

The frontend must not read CSV files or internal artifact files directly. The Next.js backend layer should expose typed endpoints or server actions that return stable view models.

Recommended API/view model areas:
- `overview`
- `globe`
- `filters`
- `donors`
- `countries`
- `corridors`
- `compare`
- `drilldown`

The server layer should be organized around services, not around raw files. In v1, services can read generated local artifacts. In v2, the same services should be replaceable with Postgres or warehouse-backed implementations with minimal frontend change.

## Database-Compatible Without Database-Dependent

The first shipped version should not require a live database for judging or Vercel deployment. Reliability matters more than runtime query sophistication in the hackathon build.

However, the architecture should assume a future database-backed implementation by:
- keeping data access behind service interfaces
- defining stable shared contracts
- avoiding UI code that depends on filesystem-specific assumptions
- separating canonical domain models from view-specific response models

## Engineering Structure

Recommended top-level structure:

- `src/app` or equivalent Next.js route structure for pages and route handlers
- `src/components` for reusable visual building blocks
- `src/features` for bounded product behaviors such as globe selection, filters, compare mode, and drilldowns
- `src/server` for API handlers, services, caching, and data access boundaries
- `src/pipeline` for CSV ingest and artifact generation
- `src/types` or `src/contracts` for shared schemas and transport contracts
- `public` only for true static assets, not core business data contracts

This decomposition is intentionally LLM-friendly. A future coding agent should be able to modify globe behavior, pipeline logic, or an insight panel without understanding the whole system at once.

## Frontend Design Principles

The frontend should be designed for a premium dashboard outcome, not a generic template.

Principles:
- the globe must dominate the composition without obscuring analytical credibility
- motion should be meaningful and restrained
- typography and spacing should carry as much of the visual quality as color
- the interface should transition from cinematic to analytical without a hard mode switch
- empty, loading, and partial-data states should still look polished
- every panel should answer a concrete decision question

## Error Handling

Three failure classes need explicit handling.

### Pipeline Failures

If the input data is malformed or the data dictionary assumptions are violated, generation should fail loudly with clear validation messages.

### Server/Data Access Failures

If generated artifacts are missing or unreadable, the backend should return structured errors rather than leaking stack traces or ambiguous empty JSON.

### Frontend Rendering Failures

The UI should present polished fallback states for:
- loading
- empty filters
- missing enrichment
- temporarily unavailable detail views

The app should never degrade to raw error text in the main experience unless the failure is unrecoverable.

## Testing Strategy

Testing should focus on trust and stability before broad UI automation.

### Highest Priority Tests

- pipeline validation tests for required columns and transformation rules
- normalization and key-resolution tests
- derived aggregate tests for donor, country, corridor, and time-series outputs
- API contract tests for stable response shapes

### Secondary Tests

- feature-level tests for filtering and selection state
- targeted UI tests for:
  - selecting a country
  - selecting a donor
  - opening a drilldown panel
  - changing compare years or filters
  - preserving selection context across mode changes

### Verification Expectations

Before implementation is considered complete, the rebuilt app should pass:
- pipeline tests
- API/service tests
- production build
- targeted interaction verification for the globe and main dashboard workflow

## Risks and Mitigations

### Risk: Globe visuals overwhelm analytical clarity

Mitigation:
- keep the globe as the entry point but move detailed reasoning into adjacent insight panels
- use restrained motion and a limited number of active overlays at once

### Risk: Hackathon v1 becomes over-engineered

Mitigation:
- keep the first backend implementation artifact-based
- avoid introducing a live database until it is justified by actual needs

### Risk: CSV semantics leak directly into UI code

Mitigation:
- force all raw-source handling into the pipeline and server layers
- expose only stable domain and view contracts to the frontend

### Risk: Future LLM edits create inconsistency

Mitigation:
- preserve strong module boundaries
- use shared typed contracts
- keep features sliced by behavior and responsibility

## Success Criteria

The rebuild is successful when:
- the deployed app opens with a high-end globe-first presentation that feels impressive in a judged setting
- users can transition naturally from passive viewing to active dashboard analysis
- funding flows, donors, countries, and trend comparisons all operate inside one coherent selection model
- the frontend consumes typed backend views instead of raw static files
- the data pipeline can regenerate the app-ready dataset from the source CSV reproducibly
- the app runs reliably on Vercel without requiring a live database
- the backend can later adopt a database implementation without forcing a frontend rewrite

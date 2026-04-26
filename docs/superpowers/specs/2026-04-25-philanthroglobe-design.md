# PhilanthroGlobe — Design Spec
**Date:** 2026-04-25  
**Track:** SP26 Data Case Competition — Product Track (Track 2)  
**Deadline:** Monday April 27, 11:59 pm  
**Developer:** Solo  

---

## Mission

Build an interactive Cesium-based dashboard for policymakers and foundation leaders to explore global philanthropy flows from the OECD dataset. Two analytical lenses: **Crisis Response** (temporal flow exploration) and **Marker Credibility** (donor accountability via OECD policy markers).

Directly answers competition sample questions:
- "What are the top donors based out of the United Kingdom?"
- "Which 5 countries receive the most funding for maternal health?"
- "How has global funding for climate changed over time?"
- "Which donor gives the most for infectious diseases in India?"

---

## Hard Constraints

- OECD data is the sole data source (no external substantive data)
- Functional dashboard with public Vercel URL
- Deadline: Monday April 27, 11:59 pm
- Stack: React 18 + TypeScript + Vite + Cesium/Resium + Zustand + Recharts + Tailwind

---

## Architecture & Data Flow

```
OECD CSV ("OECD Dataset.csv" at project root → copy/move to data/raw/oecd_philanthropy.csv)
  └─► scripts/build_data.py
        └─► public/data/*.json  (pre-aggregated static files)
              └─► React app (fetches on load, caches in memory via dataLoader.ts)
                    └─► Zustand store (single source of truth)
                          ├─► Cesium globe (reads filtered flows)
                          ├─► Left sidebar (filters + leaderboard)
                          └─► Right panel (slide-in drilldown)
```

**Extensibility principles:**
- Adding a new filter = one field in the Zustand store + one UI control in the sidebar
- Adding a new drilldown panel = one new `selectedXxx` field in the store + a new content component passed into the generic `<Panel>` wrapper
- Adding a new mode = extend the `Mode` union type + one render branch in the globe

---

## Repository Structure

```
philanthroglobe/
├── SPEC.md                         ← copy of original spec.md
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-25-philanthroglobe-design.md   ← THIS FILE
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── vercel.json
├── .env.example                    ← VITE_CESIUM_ION_TOKEN=your_token_here
├── .gitignore
│
├── public/
│   └── data/
│       ├── flows_by_year.json
│       ├── donor_summary.json
│       ├── country_summary.json
│       ├── marker_breakdown.json
│       ├── countries_geo.json
│       ├── crisis_events.json
│       └── filter_options.json     ← NEW: pre-computed dropdown values
│
├── scripts/
│   ├── build_data.py
│   ├── geocode_countries.py
│   ├── validate_data.py
│   └── requirements.txt
│
├── data/
│   └── raw/
│       └── oecd_philanthropy.csv
│
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── styles/
    │   └── globals.css
    ├── components/
    │   ├── Globe/
    │   │   ├── CesiumGlobe.tsx
    │   │   ├── ArcLayer.tsx
    │   │   ├── DonorPins.tsx
    │   │   └── CrisisAnnotations.tsx
    │   ├── Controls/
    │   │   ├── ModeToggle.tsx
    │   │   ├── YearControls.tsx    ← REPLACES YearSlider + PlayButton
    │   │   ├── FlowSizeSlider.tsx  ← NEW
    │   │   ├── SectorFilter.tsx
    │   │   ├── DonorCountryFilter.tsx  ← NEW
    │   │   └── MarkerSelector.tsx
    │   ├── Sidebar/
    │   │   ├── LeftSidebar.tsx
    │   │   └── Leaderboard.tsx     ← NEW
    │   ├── Panel/
    │   │   ├── Panel.tsx           ← NEW: generic slide-in container
    │   │   ├── DonorPanel.tsx
    │   │   ├── CountryPanel.tsx
    │   │   └── MarkerCredibilityCard.tsx
    │   └── Layout/
    │       ├── Header.tsx
    │       └── MethodologyFooter.tsx
    ├── lib/
    │   ├── dataLoader.ts
    │   ├── filters.ts              ← single place all filter logic lives
    │   ├── colorScales.ts
    │   └── arcGeometry.ts
    ├── state/
    │   └── store.ts
    └── types/
        └── index.ts
```

---

## Data Pipeline

### Changes vs. original spec

1. **All 7 markers** — `marker_breakdown.json` includes: `gender`, `climate_mitigation`, `climate_adaptation`, `environment`, `biodiversity`, `desertification`, `nutrition`
2. **No hard cap on donors** — include all donors in `donor_summary.json`, add a `rank` field (top 50 by total disbursement get `rank` 1–50, others get `null`). Keeps the full dataset explorable.
3. **New `filter_options.json`** — pre-computed filter dropdown values (see schema below)
4. **`growth_rates` pre-computed** — `build_data.py` computes growth from 2020→2023 per donor→recipient pair, stored in `flows_by_year.json` so the frontend doesn't calculate deltas at runtime
5. **`crisis_events.json`** — manually curated editorial file (not computed). Add new events by appending a JSON object.

### `scripts/build_data.py`

```python
"""
Preprocess OECD philanthropy CSV into pre-aggregated JSON files for the dashboard.

Inputs:  data/raw/oecd_philanthropy.csv
         scripts/country_centroids.csv  (generated by geocode_countries.py)

Outputs: public/data/flows_by_year.json
         public/data/donor_summary.json
         public/data/country_summary.json
         public/data/marker_breakdown.json
         public/data/countries_geo.json
         public/data/filter_options.json

Raw CSV column notes (actual column names differ from output schema):
  - `country` (string recipient name) → must be mapped to ISO3 via lookup table
  - `Donor_country` (capital D, full country name e.g. "United Kingdom") → map to ISO3
    for flows schema; keep full name for filter_options donor_countries list
  - `Year` may be "2020-2023" string for NDA-aggregated rows — exclude from time-series
  - `usd_disbursements_defl` is the disbursement amount field
  - The file currently lives at "OECD Dataset.csv" in the project root;
    move it to data/raw/oecd_philanthropy.csv before running this script

Key transformations:
  1. Standardize donor names (strip, normalize case, generate stable donor_id slug)
  2. Map `country` (recipient name strings) to ISO3 codes using country_centroids.csv;
     drop rows with unmappable recipients and log count
  3. Map `Donor_country` full names to ISO3 for flows; preserve full names for filter_options
  4. Exclude NDA-aggregated rows (year='2020-2023') from time-series outputs;
     include in donor totals with a note field
  5. Include ALL donors; add rank field (1-N by total disbursement, null if unranked)
  6. flows_by_year: aggregate by (year, donor_id, recipient_iso3) summing
     usd_disbursements_defl. Include all flows >= $0.01M (small floor, slider handles display).
     Add growth_rate field computed at RECIPIENT-COUNTRY level (not per donor→recipient pair)
     to ensure meaningful trend coverage: pct change in total receipts 2020→2023 per iso3.
     Null if recipient country missing from either endpoint year.
  7. marker_breakdown: compute all 7 markers (gender, climate_mitigation,
     climate_adaptation, environment, biodiversity, desertification, nutrition).
     screened_pct, principal_pct (score=2), significant_pct (score=1),
     not_targeted_pct (score=0), credibility_score = principal_pct + 0.5*significant_pct
     NULL = not screened
  8. Top sectors: collapse subsector codes into ~8 user-friendly groups
     (Health, Education, Climate, Emergency, Environment, Economic Dev, Gov, Other)
  9. filter_options: donor_countries as full names (e.g. "United Kingdom") matching
     Donor_country values; sectors as display names; year_min/year_max as integers
  10. Output validation: ensure all donor_ids in flows match donor_summary,
      all recipient_iso3 match countries_geo. Fail loudly on mismatch.

Print summary stats at end:
  - Total rows raw vs processed
  - Number of donors, countries, years
  - Total USD disbursed
  - Rows excluded (NDA aggregation, country mapping failure)
  - Output file sizes
"""
```

### `scripts/geocode_countries.py`

```python
"""
Generate country_centroids.csv with ISO3 + lat/lon for all DAC recipient countries.
Use a static lookup (pycountry or hardcoded JSON). DO NOT call external geocoding APIs.
Output: scripts/country_centroids.csv (iso3, name, lat, lon, continent)
"""
```

### `scripts/validate_data.py`

```python
"""
Sanity-check all output JSONs before deploy.
Checks: valid JSON, consistent donor_ids and iso3 across files, file sizes <5MB,
no unexpected nulls, marker percentages sum to ~1.0, growth_rate fields present.
Exit non-zero on failure.
"""
```

---

## Data Schemas

### `filter_options.json` (NEW)

```json
{
  "donor_countries": ["Australia", "France", "United Kingdom"],
  // Full names matching raw Donor_country values. Frontend filters flows by matching
  // donor_country full name; flows_by_year stores donor_country as full name too (not ISO3).
  "sectors": ["Emergency Response", "Education", "Climate", "Health",
              "Environment", "Economic Dev", "Gov & Civil Society", "Other"],
  "year_min": 2020,
  "year_max": 2023,
  "markers": ["gender", "climate_mitigation", "climate_adaptation",
              "environment", "biodiversity", "desertification", "nutrition"]
}
```

### `flows_by_year.json`

```json
{
  "years": [2020, 2021, 2022, 2023],
  "flows": [
    {
      "year": 2022,
      "donor_id": "lund_trust",
      "donor_name": "Lund Trust",
      "donor_country": "United Kingdom",   // full name, matches filter_options.donor_countries
      "recipient_iso3": "UKR",
      "recipient_name": "Ukraine",
      "usd_disbursed_m": 11.21,
      "n_projects": 3,
      "top_sector": "Emergency Response",
      "top_sector_code": 720,
      "growth_rate": 0.42   // recipient-country level: pct change in total receipts 2020→2023
    }
  ]
}
```

### `donor_summary.json`

```json
[
  {
    "donor_id": "lund_trust",
    "donor_name": "Lund Trust",
    "donor_country": "GBR",
    "total_usd_m": 145.3,
    "n_projects": 287,
    "n_countries": 42,
    "rank": 1,
    "top_sectors": [{"name": "Emergency Response", "usd_m": 32.1}],
    "top_recipients": [{"iso3": "UKR", "name": "Ukraine", "usd_m": 12.5}],
    "year_range": [2020, 2023]
  }
]
```

### `country_summary.json`

```json
[
  {
    "iso3": "UKR",
    "name": "Ukraine",
    "total_received_usd_m": 245.0,
    "n_donors": 18,
    "n_projects": 89,
    "top_donors": [{"donor_id": "lund_trust", "donor_name": "Lund Trust", "usd_m": 12.5}],
    "top_sectors": [{"name": "Emergency Response", "usd_m": 130.2}],
    "by_year": {"2020": 8.1, "2021": 6.4, "2022": 145.6, "2023": 67.3}
  }
]
```

### `marker_breakdown.json`

```json
[
  {
    "donor_id": "lund_trust",
    "donor_name": "Lund Trust",
    "markers": {
      "gender": {
        "screened_pct": 0.85,
        "principal_pct": 0.18,
        "significant_pct": 0.31,
        "not_targeted_pct": 0.36,
        "credibility_score": 0.49
      },
      "climate_mitigation": {"screened_pct": 0.92, "principal_pct": 0.41, "significant_pct": 0.23, "not_targeted_pct": 0.28, "credibility_score": 0.64},
      "climate_adaptation": {"screened_pct": 0.80, "principal_pct": 0.30, "significant_pct": 0.25, "not_targeted_pct": 0.25, "credibility_score": 0.43},
      "environment":        {"screened_pct": 0.70, "principal_pct": 0.20, "significant_pct": 0.20, "not_targeted_pct": 0.30, "credibility_score": 0.30},
      "biodiversity":       {"screened_pct": 0.78, "principal_pct": 0.22, "significant_pct": 0.15, "not_targeted_pct": 0.41, "credibility_score": 0.37},
      "desertification":    {"screened_pct": 0.60, "principal_pct": 0.10, "significant_pct": 0.10, "not_targeted_pct": 0.40, "credibility_score": 0.15},
      "nutrition":          {"screened_pct": 0.75, "principal_pct": 0.25, "significant_pct": 0.20, "not_targeted_pct": 0.30, "credibility_score": 0.35}
    }
  }
]
```

`credibility_score` = `principal_pct * 1.0 + significant_pct * 0.5`

### `countries_geo.json`

```json
[{"iso3": "UKR", "name": "Ukraine", "lat": 49.0, "lon": 32.0, "continent": "Europe"}]
```

### `crisis_events.json` (manually curated)

```json
[
  {
    "id": "ukraine_2022",
    "name": "Russian invasion of Ukraine",
    "year": 2022,
    "country_iso3": "UKR",
    "lat": 49.0,
    "lon": 32.0,
    "description": "Full-scale invasion triggered the largest humanitarian funding response in recent OECD philanthropy data.",
    "highlight_color": "#ff6b35"
  },
  {
    "id": "covid_2020",
    "name": "COVID-19 global pandemic",
    "year": 2020,
    "country_iso3": null,
    "lat": null,
    "lon": null,
    "description": "Global health emergency triggered cross-sector philanthropic response.",
    "highlight_color": "#3a86ff"
  }
]
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  PhilanthroGlobe        [Crisis Response] [Credibility]      │
├──────────────┬──────────────────────────────┬────────────────┤
│ LEFT SIDEBAR │                              │  RIGHT PANEL   │
│              │      CESIUM GLOBE            │  (slide-in)    │
│ Donor        │      (full bleed)            │                │
│ Country ▼    │                              │  DonorPanel    │
│              │                              │   — or —       │
│ Sector ▼     │                              │  CountryPanel  │
│              │                              │                │
│ Flow size    │                              │  (generic      │
│ [$──●──$100M]│                              │   <Panel>      │
│              │                              │   chrome)      │
│ ──────────── │                              │                │
│ Leaderboard  │                              │                │
│ Top 10       │                              │                │
│ (reactive to │                              │                │
│  all filters)│                              │                │
├──────────────┴──────────────────────────────┴────────────────┤
│ [2020][2021][2022][2023][All][Compare ⇄]    [Marker ▼]       │
├──────────────────────────────────────────────────────────────┤
│ Source: OECD Private Philanthropy for Development …          │
└──────────────────────────────────────────────────────────────┘
```

---

## Year Controls (replaces year slider)

The dataset spans 2020–2023 (4 discrete years). A continuous slider is replaced with:

| Control | Behavior |
|---|---|
| `[2020]` `[2021]` `[2022]` `[2023]` | Pill toggle buttons. Select one year → globe shows only that year's flows |
| `[All]` | Show cumulative flows; arc colors shift to **trend coloring** (green = grew 2020→2023, red = shrank, gray = stable or no comparison available) |
| `[Compare ⇄]` | Opens two year pickers. Globe shows delta: new flows in second year appear, disappeared flows fade, arc thickness = absolute size |

The `[Marker ▼]` dropdown is only enabled in Credibility mode.

---

## State Management

```typescript
type MarkerKey = 'gender' | 'climate_mitigation' | 'climate_adaptation' |
                 'environment' | 'biodiversity' | 'desertification' | 'nutrition'

type YearSelection = number | 'all' | 'compare'

interface AppState {
  // Mode
  mode: 'crisis' | 'credibility'
  setMode: (m: Mode) => void

  // Year controls
  yearSelection: YearSelection
  setYearSelection: (y: YearSelection) => void
  compareYears: [number, number]
  setCompareYears: (years: [number, number]) => void

  // Filters
  donorCountry: string | null
  setDonorCountry: (c: string | null) => void
  sector: string | null
  setSector: (s: string | null) => void
  flowSizeMin: number
  setFlowSizeMin: (n: number) => void

  // Credibility mode
  selectedMarker: MarkerKey
  setSelectedMarker: (m: MarkerKey) => void

  // Drilldown panels
  selectedDonorId: string | null
  setSelectedDonorId: (id: string | null) => void
  selectedCountryIso3: string | null
  setSelectedCountryIso3: (iso3: string | null) => void
  // Future: selectedSector, selectedSDG — same pattern
}
```

`filters.ts` is the single place that reads the store and returns the filtered flow subset. All components (globe, leaderboard, panels) consume that filtered view.

---

## Component Descriptions

### `CesiumGlobe.tsx`
Resium `<Viewer>` wrapper. Earth-centered camera. Disable built-in timeline and animation widgets. Listen to entity clicks; dispatch `setSelectedDonorId` or `setSelectedCountryIso3` to store.

### `ArcLayer.tsx`
Renders flows as `PolylineGraphics` with bezier curves between donor country and recipient country centroids. Arc thickness proportional to `usd_disbursed_m`.

Color logic:
- **Crisis mode, single year**: color by sector
- **Crisis mode, All**: color by `growth_rate` (green/red/gray scale)
- **Crisis mode, Compare**: color by delta direction
- **Credibility mode**: color arcs originating from a donor by their `credibility_score` for the selected marker

### `YearControls.tsx`
Pill buttons for 2020/2021/2022/2023/All + Compare toggle. Compare opens an inline two-picker. Updates `yearSelection` and `compareYears` in store.

### `FlowSizeSlider.tsx`
Range slider in the left sidebar. Updates `flowSizeMin` in store. Label shows current threshold (e.g. "$0.5M+").

### `Leaderboard.tsx`
Reactive ranked list. Reads filtered flows from `filters.ts`. Shows top 10 donors OR top 10 recipient countries (toggle between the two). Updates instantly when any filter changes. Clicking a leaderboard row sets `selectedDonorId` or `selectedCountryIso3`.

### `Panel.tsx` (generic)
Slide-in container from the right. Props: `title`, `onClose`, `children`. DonorPanel and CountryPanel pass their content as children. Adding any new panel = writing only the content component.

### `DonorPanel.tsx`
Content for donor drilldown. Shows: donor name, total USD, top sectors (Recharts bar), top recipients (Recharts bar), marker breakdown card (only shown in Credibility mode).

### `CountryPanel.tsx`
Content for country drilldown. Shows: country name, total received, top donors, sector breakdown, year-over-year line chart (Recharts).

### `MarkerCredibilityCard.tsx`
Rendered inside DonorPanel. Shows all 7 markers as a horizontal bar chart of credibility scores.

### `CrisisAnnotations.tsx`
Reads `crisis_events.json`. Renders pulsing pins on globe at relevant lat/lon when `yearSelection` matches event year. Click expands description.

### `MethodologyFooter.tsx`
Always visible. Three lines:
- "Source: OECD Private Philanthropy for Development. NDA-aggregated rows excluded from time-series."
- "Markers: 0=not targeted, 1=significant, 2=principal. NULL=not screened."
- "Credibility = principal_pct + 0.5 × significant_pct. Higher = better alignment."

---

## Package Configuration

```json
{
  "name": "philanthroglobe",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "resium": "^1.18.1",
    "cesium": "^1.118.0",
    "zustand": "^4.5.2",
    "recharts": "^2.12.7",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "vite-plugin-cesium": "^1.2.22"
  }
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  plugins: [react(), cesium()],
  server: { port: 5173 }
})
```

---

## Deployment

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

Use Vercel's GitHub integration for auto-deploy on push. No workflow file needed.

---

## Implementation Sequence

Ordered to front-load risk and ensure a deployable artifact exists as early as possible. Steps 1–8 alone produce a fully functional, competition-ready dashboard.

1. `scripts/geocode_countries.py` → `country_centroids.csv`
2. `scripts/build_data.py` → all JSON files in `public/data/`
3. `scripts/validate_data.py` → confirm data integrity
4. Scaffold: `package.json`, `vite.config.ts`, `tailwind`, `types/index.ts`, `store.ts`
5. **Cesium globe** — `CesiumGlobe.tsx` + `ArcLayer.tsx` with static data (highest-risk, do first)
6. Layout shell: `Header`, left sidebar (filters, no logic yet), bottom bar (`YearControls`, `FlowSizeSlider`)
7. `dataLoader.ts` + `filters.ts` → wire all filters to the globe
8. `Leaderboard.tsx` (reactive to filters)
9. `DonorPanel.tsx` + `CountryPanel.tsx` via generic `<Panel>`
10. Trend coloring on "All" year selection
11. Compare mode (two year pickers, delta arc colors)
12. Marker Credibility mode + all 7 markers + `MarkerCredibilityCard`
13. `CrisisAnnotations.tsx`
14. Vercel deploy + final polish

**Cut line:** Steps 10–13 are additive. If time is short, cut from the bottom up — steps 1–9 are the core.

---

## Pre-Flight Checklist

Do these BEFORE starting Claude Code:

- [ ] **Sign up for Cesium Ion and get your token** → https://ion.cesium.com (5 min; without it the globe renders with a banner overlay)
- [ ] Move `OECD Dataset.csv` from project root → `data/raw/oecd_philanthropy.csv`
- [ ] Create `.env` with `VITE_CESIUM_ION_TOKEN=your_token_here`
- [ ] Node 18+ and Python 3.10+ installed
- [ ] `git init` and initial commit
- [ ] Push to GitHub
- [ ] Connect Vercel to repo

---

## Resuming This Work

This file is the single source of truth for the design. To resume:
1. Open Claude Code in the `philanthroglobe/` repo directory
2. Point Claude Code at this spec: `docs/superpowers/specs/2026-04-25-philanthroglobe-design.md`
3. Start at whichever implementation sequence step is next

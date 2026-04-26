# PhilanthroGlobe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy an interactive Cesium globe dashboard for exploring 110k+ OECD philanthropy transactions, with filters, leaderboard, drilldown panels, trend/compare year modes, and marker credibility analysis.

**Architecture:** Python pipeline pre-aggregates `data/raw/oecd_philanthropy.csv` into 7 static JSON files in `public/data/`. A React/Vite app loads these on start and caches them. A Zustand store is the single source of truth for all filter state. `src/lib/filters.ts` is the only place filter logic lives — all components consume its output.

**Tech Stack:** Python 3.10+ (pandas, pycountry), React 18 + TypeScript 5, Vite 5 + vite-plugin-cesium, Resium 1.18, Zustand 4, Recharts 2, Tailwind CSS 3, Vitest, Vercel

**Spec:** `docs/superpowers/specs/2026-04-25-philanthroglobe-design.md`

**Note on `donor_country` field:** Use full country names (e.g. `"United Kingdom"`) everywhere — in `flows_by_year.json`, `donor_summary.json`, and `filter_options.json`. This makes filter matching trivial. The spec example showing `"GBR"` in `donor_summary` is a typo; fix it.

---

## File Map

| File | Responsibility |
|---|---|
| `scripts/geocode_countries.py` | Generates `country_centroids.csv` (ISO3 + lat/lon lookup) |
| `scripts/build_data.py` | Full pipeline: CSV → 7 JSON files |
| `scripts/validate_data.py` | Post-pipeline sanity checks, exits non-zero on failure |
| `scripts/tests/test_build_data.py` | Pytest tests for sector mapping, marker stats, growth rate |
| `public/data/filter_options.json` | Pre-computed dropdown values (donor countries, sectors, years) |
| `public/data/flows_by_year.json` | Aggregated flows with growth_rate |
| `public/data/donor_summary.json` | Per-donor totals, sectors, recipients, rank |
| `public/data/country_summary.json` | Per-country totals, donors, sectors, by_year |
| `public/data/marker_breakdown.json` | All 7 marker stats per donor |
| `public/data/countries_geo.json` | ISO3 → lat/lon/continent lookup |
| `public/data/crisis_events.json` | Manually curated editorial events |
| `src/types/index.ts` | All TypeScript interfaces and union types |
| `src/state/store.ts` | Zustand store — all app state |
| `src/lib/dataLoader.ts` | Fetches + caches all JSON files |
| `src/lib/filters.ts` | Applies store state to produce filtered flow subsets |
| `src/lib/filters.test.ts` | Vitest tests for filter logic |
| `src/lib/colorScales.ts` | Arc colors by sector, growth rate, credibility score |
| `src/lib/arcGeometry.ts` | Bezier curve point generation for Cesium polylines |
| `src/main.tsx` | React root mount |
| `src/App.tsx` | Top-level layout: sidebar + globe + panel + controls |
| `src/styles/globals.css` | Tailwind directives + Cesium full-screen overrides |
| `src/components/Layout/Header.tsx` | App title + ModeToggle |
| `src/components/Layout/MethodologyFooter.tsx` | Always-visible 3-line data attribution |
| `src/components/Globe/CesiumGlobe.tsx` | Resium Viewer wrapper; handles entity clicks |
| `src/components/Globe/ArcLayer.tsx` | Renders flows as Cesium polylines with bezier curves |
| `src/components/Globe/CrisisAnnotations.tsx` | Pulsing pins for crisis events matching current year |
| `src/components/Controls/ModeToggle.tsx` | Crisis / Credibility pill switcher |
| `src/components/Controls/YearControls.tsx` | Year pills + All + Compare toggle |
| `src/components/Controls/MarkerSelector.tsx` | 7-marker dropdown (credibility mode only) |
| `src/components/Sidebar/LeftSidebar.tsx` | Container: filter controls + leaderboard |
| `src/components/Sidebar/Leaderboard.tsx` | Top-10 donors or countries, reactive to all filters |
| `src/components/Controls/DonorCountryFilter.tsx` | Dropdown filter by donor country |
| `src/components/Controls/SectorFilter.tsx` | Dropdown filter by sector |
| `src/components/Controls/FlowSizeSlider.tsx` | Min USD disbursement slider |
| `src/components/Panel/Panel.tsx` | Generic slide-in right panel with title + close |
| `src/components/Panel/DonorPanel.tsx` | Donor drilldown content |
| `src/components/Panel/CountryPanel.tsx` | Country drilldown content |
| `src/components/Panel/MarkerCredibilityCard.tsx` | Horizontal bar chart of 7 marker credibility scores |

---

## Phase 1: Data Pipeline

### Task 1: Repository scaffold

**Files:**
- Create: `data/raw/.gitkeep`
- Create: `public/data/.gitkeep`
- Create: `scripts/requirements.txt`
- Create: `.gitignore`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p data/raw public/data scripts/tests
touch data/raw/.gitkeep public/data/.gitkeep
```

- [ ] **Step 2: Write `scripts/requirements.txt`**

```
pandas==2.2.2
numpy==1.26.4
pycountry==23.12.11
pytest==8.2.0
```

- [ ] **Step 3: Write `.gitignore`**

```
# Python
__pycache__/
*.py[cod]
.venv/
venv/
.pytest_cache/

# Node
node_modules/
dist/
.next/

# Data
data/raw/*.csv

# Env
.env
.env.local

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
```

- [ ] **Step 4: Move the OECD CSV**

```bash
# From the project root (SP26 Data Case Comp), copy to the repo:
cp "OECD Dataset.csv" philanthroglobe/data/raw/oecd_philanthropy.csv
```

- [ ] **Step 5: Install Python deps**

```bash
cd scripts && pip install -r requirements.txt
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: scaffold repo structure and data directories"
```

---

### Task 2: `scripts/geocode_countries.py`

**Files:**
- Create: `scripts/geocode_countries.py`
- Create: `scripts/country_centroids.csv` (generated)
- Create: `scripts/tests/test_geocode.py`

- [ ] **Step 1: Write failing test**

```python
# scripts/tests/test_geocode.py
import subprocess, csv, os

def test_centroids_file_created():
    result = subprocess.run(
        ["python", "scripts/geocode_countries.py"],
        capture_output=True, text=True
    )
    assert result.returncode == 0
    assert os.path.exists("scripts/country_centroids.csv")

def test_centroids_has_required_columns():
    with open("scripts/country_centroids.csv") as f:
        reader = csv.DictReader(f)
        row = next(reader)
    assert set(["iso3", "name", "lat", "lon", "continent"]).issubset(row.keys())

def test_centroids_ukraine_present():
    with open("scripts/country_centroids.csv") as f:
        rows = list(csv.DictReader(f))
    iso3s = [r["iso3"] for r in rows]
    assert "UKR" in iso3s
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /path/to/philanthroglobe
pytest scripts/tests/test_geocode.py -v
```
Expected: FAIL (file doesn't exist yet)

- [ ] **Step 3: Write `scripts/geocode_countries.py`**

```python
"""
Generate country_centroids.csv with ISO3 + lat/lon for DAC recipient countries.
Uses a hardcoded centroid dict (no external API). pycountry resolves name→ISO3
for any country not in the hardcoded set.
Output: scripts/country_centroids.csv (iso3, name, lat, lon, continent)
"""
import csv, os
import pycountry

# ISO3 → (lat, lon, continent)
CENTROIDS = {
    "AFG": (33.93, 67.71, "Asia"), "AGO": (-11.20, 17.87, "Africa"),
    "ALB": (41.15, 20.17, "Europe"), "ARM": (40.07, 45.04, "Asia"),
    "AZE": (40.14, 47.58, "Asia"), "BDI": (-3.37, 29.92, "Africa"),
    "BEN": (9.31, 2.32, "Africa"), "BFA": (12.36, -1.53, "Africa"),
    "BGD": (23.68, 90.36, "Asia"), "BIH": (43.92, 17.68, "Europe"),
    "BOL": (-16.29, -63.59, "Americas"), "BRA": (-14.24, -51.93, "Americas"),
    "BTN": (27.51, 90.43, "Asia"), "CAF": (6.61, 20.94, "Africa"),
    "CIV": (7.54, -5.55, "Africa"), "CMR": (3.85, 11.50, "Africa"),
    "COD": (-4.04, 21.76, "Africa"), "COG": (-0.23, 15.83, "Africa"),
    "COL": (4.57, -74.30, "Americas"), "COM": (-11.64, 43.33, "Africa"),
    "CPV": (16.54, -23.04, "Africa"), "CUB": (21.52, -77.78, "Americas"),
    "DJI": (11.83, 42.59, "Africa"), "DZA": (28.03, 1.66, "Africa"),
    "ECU": (-1.83, -78.18, "Americas"), "EGY": (26.82, 30.80, "Africa"),
    "ERI": (15.18, 39.78, "Africa"), "ETH": (9.15, 40.49, "Africa"),
    "GEO": (42.32, 43.36, "Asia"), "GHA": (7.95, -1.02, "Africa"),
    "GIN": (9.95, -11.24, "Africa"), "GMB": (13.44, -15.31, "Africa"),
    "GNB": (11.80, -15.18, "Africa"), "GTM": (15.78, -90.23, "Americas"),
    "GUY": (4.86, -58.93, "Americas"), "HND": (15.20, -86.24, "Americas"),
    "HTI": (18.97, -72.29, "Americas"), "IDN": (-0.79, 113.92, "Asia"),
    "IND": (20.59, 78.96, "Asia"), "IRN": (32.43, 53.69, "Asia"),
    "IRQ": (33.22, 43.68, "Asia"), "JAM": (18.11, -77.30, "Americas"),
    "JOR": (30.59, 36.24, "Asia"), "KEN": (-0.02, 37.91, "Africa"),
    "KGZ": (41.20, 74.77, "Asia"), "KHM": (12.57, 104.99, "Asia"),
    "LAO": (19.86, 102.50, "Asia"), "LBN": (33.85, 35.86, "Asia"),
    "LBR": (6.43, -9.43, "Africa"), "LBY": (26.34, 17.23, "Africa"),
    "LKA": (7.87, 80.77, "Asia"), "LSO": (-29.61, 28.23, "Africa"),
    "MDG": (-18.77, 46.87, "Africa"), "MDV": (3.20, 73.22, "Asia"),
    "MLI": (17.57, -3.99, "Africa"), "MMR": (21.92, 95.96, "Asia"),
    "MOZ": (-18.67, 35.53, "Africa"), "MRT": (21.01, -10.94, "Africa"),
    "MWI": (-13.25, 34.30, "Africa"), "MYS": (4.21, 101.98, "Asia"),
    "NAM": (-22.96, 18.49, "Africa"), "NER": (17.61, 8.08, "Africa"),
    "NGA": (9.08, 8.68, "Africa"), "NIC": (12.87, -85.21, "Americas"),
    "NPL": (28.39, 84.12, "Asia"), "PAK": (30.38, 69.35, "Asia"),
    "PAN": (8.54, -80.78, "Americas"), "PER": (-9.19, -75.02, "Americas"),
    "PHL": (12.88, 121.77, "Asia"), "PNG": (-6.31, 143.96, "Oceania"),
    "PRK": (40.34, 127.51, "Asia"), "PSE": (31.95, 35.23, "Asia"),
    "RWA": (-1.94, 29.87, "Africa"), "SDN": (12.86, 30.22, "Africa"),
    "SEN": (14.50, -14.45, "Africa"), "SLE": (8.46, -11.78, "Africa"),
    "SOM": (5.15, 46.20, "Africa"), "SSD": (6.88, 31.75, "Africa"),
    "STP": (0.19, 6.61, "Africa"), "SUR": (3.92, -56.03, "Americas"),
    "SYR": (34.80, 38.99, "Asia"), "TCD": (15.45, 18.73, "Africa"),
    "TGO": (8.62, 0.82, "Africa"), "TJK": (38.86, 71.28, "Asia"),
    "TKM": (38.97, 59.56, "Asia"), "TLS": (-8.87, 125.73, "Asia"),
    "TUN": (33.89, 9.54, "Africa"), "TZA": (-6.37, 34.89, "Africa"),
    "UGA": (1.37, 32.29, "Africa"), "UKR": (49.00, 32.00, "Europe"),
    "UZB": (41.38, 64.59, "Asia"), "VEN": (6.42, -66.59, "Americas"),
    "VNM": (14.06, 108.28, "Asia"), "YEM": (15.55, 48.52, "Asia"),
    "ZMB": (-13.13, 27.85, "Africa"), "ZWE": (-19.02, 29.15, "Africa"),
    "MKD": (41.61, 21.75, "Europe"), "MDA": (47.41, 28.37, "Europe"),
    "KAZ": (48.02, 66.92, "Asia"), "MNG": (46.86, 103.85, "Asia"),
    "GRC": (39.07, 21.82, "Europe"), "TUR": (38.96, 35.24, "Europe"),
    "MAR": (31.79, -7.09, "Africa"), "BLR": (53.71, 27.95, "Europe"),
    "UZB": (41.38, 64.59, "Asia"), "XKX": (42.60, 20.90, "Europe"),
    "SRB": (44.02, 21.01, "Europe"), "MNE": (42.71, 19.37, "Europe"),
    "BIH": (43.92, 17.68, "Europe"), "MKD": (41.61, 21.75, "Europe"),
    "HRV": (45.10, 15.20, "Europe"),
    # Additional common recipients
    "BWA": (-22.33, 24.68, "Africa"), "SWZ": (-26.52, 31.47, "Africa"),
    "ZAF": (-30.56, 22.94, "Africa"), "GNQ": (1.65, 10.27, "Africa"),
    "GAB": (-0.80, 11.61, "Africa"), "RUS": (61.52, 105.32, "Europe"),
    "CHN": (35.86, 104.20, "Asia"), "MEX": (23.63, -102.55, "Americas"),
    "ARG": (-38.42, -63.62, "Americas"), "CHL": (-35.68, -71.54, "Americas"),
    "URY": (-32.52, -55.77, "Americas"), "PRY": (-23.44, -58.44, "Americas"),
    "THA": (15.87, 100.99, "Asia"), "KOR": (35.91, 127.77, "Asia"),
    "BGD": (23.68, 90.36, "Asia"), "LKA": (7.87, 80.77, "Asia"),
    "MUS": (-20.35, 57.55, "Africa"), "CPV": (16.54, -23.04, "Africa"),
}

# Names that pycountry doesn't resolve cleanly → explicit ISO3 mapping
NAME_OVERRIDES = {
    "West Bank and Gaza Strip": "PSE",
    "Palestinian Territory": "PSE",
    "Gaza Strip": "PSE",
    "West Bank": "PSE",
    "Kosovo": "XKX",
    "Democratic Republic of the Congo": "COD",
    "Congo, Democratic Republic": "COD",
    "Congo, Republic": "COG",
    "Republic of Congo": "COG",
    "Tanzania": "TZA",
    "United Republic of Tanzania": "TZA",
    "Syria": "SYR",
    "Syrian Arab Republic": "SYR",
    "Iran": "IRN",
    "Iran, Islamic Republic of": "IRN",
    "Bolivia": "BOL",
    "Bolivia, Plurinational State of": "BOL",
    "Venezuela": "VEN",
    "Venezuela, Bolivarian Republic of": "VEN",
    "Kyrgyzstan": "KGZ",
    "Kyrgyz Republic": "KGZ",
    "Laos": "LAO",
    "Lao PDR": "LAO",
    "Lao People's Democratic Republic": "LAO",
    "Vietnam": "VNM",
    "Viet Nam": "VNM",
    "North Korea": "PRK",
    "Korea, Democratic People's Republic of": "PRK",
    "East Timor": "TLS",
    "Timor-Leste": "TLS",
    "Sao Tome and Principe": "STP",
    "São Tomé and Príncipe": "STP",
    "Sudan (former)": "SDN",
    "Ivory Coast": "CIV",
    "Côte d'Ivoire": "CIV",
    "Myanmar": "MMR",
    "Burma": "MMR",
    "Macedonia": "MKD",
    "North Macedonia": "MKD",
    "Moldova": "MDA",
    "Republic of Moldova": "MDA",
    "Cape Verde": "CPV",
    "Micronesia": "FSM",
    "Micronesia, Federated States of": "FSM",
}


def name_to_iso3(name: str) -> str | None:
    if name in NAME_OVERRIDES:
        return NAME_OVERRIDES[name]
    try:
        country = pycountry.countries.search_fuzzy(name)
        if country:
            return country[0].alpha_3
    except LookupError:
        pass
    return None


def main():
    rows = []
    for iso3, (lat, lon, continent) in CENTROIDS.items():
        try:
            country = pycountry.countries.get(alpha_3=iso3)
            name = country.name if country else iso3
        except Exception:
            name = iso3
        rows.append({"iso3": iso3, "name": name, "lat": lat, "lon": lon, "continent": continent})

    out_path = os.path.join(os.path.dirname(__file__), "country_centroids.csv")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["iso3", "name", "lat", "lon", "continent"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} countries to {out_path}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests**

```bash
pytest scripts/tests/test_geocode.py -v
```
Expected: 3 PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/geocode_countries.py scripts/tests/test_geocode.py scripts/country_centroids.csv
git commit -m "feat: geocode countries centroid lookup"
```

---

### Task 3: `scripts/build_data.py`

**Files:**
- Create: `scripts/build_data.py`
- Create: `scripts/tests/test_build_data.py`

- [ ] **Step 1: Write failing tests**

```python
# scripts/tests/test_build_data.py
import json, os, subprocess, pytest

OUTPUT_FILES = [
    "public/data/flows_by_year.json",
    "public/data/donor_summary.json",
    "public/data/country_summary.json",
    "public/data/marker_breakdown.json",
    "public/data/countries_geo.json",
    "public/data/filter_options.json",
]

@pytest.fixture(scope="module")
def run_pipeline():
    result = subprocess.run(
        ["python", "scripts/build_data.py"],
        capture_output=True, text=True
    )
    assert result.returncode == 0, f"Pipeline failed:\n{result.stdout}\n{result.stderr}"
    return result

def test_all_output_files_created(run_pipeline):
    for path in OUTPUT_FILES:
        assert os.path.exists(path), f"Missing: {path}"

def test_flows_schema(run_pipeline):
    with open("public/data/flows_by_year.json") as f:
        data = json.load(f)
    assert "years" in data
    assert "flows" in data
    flow = data["flows"][0]
    for field in ["year", "donor_id", "donor_name", "donor_country",
                  "recipient_iso3", "recipient_name", "usd_disbursed_m",
                  "top_sector", "growth_rate"]:
        assert field in flow, f"Missing field: {field}"
    # donor_country must be full name not ISO3
    assert len(flow["donor_country"]) > 3, "donor_country should be full name"

def test_donor_summary_has_rank(run_pipeline):
    with open("public/data/donor_summary.json") as f:
        donors = json.load(f)
    assert len(donors) > 0
    assert "rank" in donors[0]
    ranked = [d for d in donors if d["rank"] is not None]
    assert len(ranked) > 0

def test_marker_breakdown_has_all_seven(run_pipeline):
    with open("public/data/marker_breakdown.json") as f:
        data = json.load(f)
    assert len(data) > 0
    markers = data[0]["markers"]
    for key in ["gender", "climate_mitigation", "climate_adaptation",
                "environment", "biodiversity", "desertification", "nutrition"]:
        assert key in markers, f"Missing marker: {key}"

def test_marker_credibility_score_formula(run_pipeline):
    with open("public/data/marker_breakdown.json") as f:
        data = json.load(f)
    for donor in data:
        for key, stats in donor["markers"].items():
            expected = round(stats["principal_pct"] + 0.5 * stats["significant_pct"], 4)
            actual = round(stats["credibility_score"], 4)
            assert abs(expected - actual) < 0.01, f"Bad credibility score for {donor['donor_id']} {key}"

def test_filter_options_donor_countries_are_full_names(run_pipeline):
    with open("public/data/filter_options.json") as f:
        opts = json.load(f)
    for name in opts["donor_countries"]:
        assert len(name) > 3, f"Expected full name, got: {name}"

def test_growth_rate_field_present_on_flows(run_pipeline):
    with open("public/data/flows_by_year.json") as f:
        data = json.load(f)
    # growth_rate may be null but field must exist
    for flow in data["flows"][:50]:
        assert "growth_rate" in flow

def test_sector_mapping_to_eight_groups(run_pipeline):
    with open("public/data/filter_options.json") as f:
        opts = json.load(f)
    valid = {"Health", "Education", "Climate", "Emergency", "Environment",
             "Economic Dev", "Gov & Civil Society", "Other"}
    for s in opts["sectors"]:
        assert s in valid, f"Unknown sector group: {s}"
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest scripts/tests/test_build_data.py -v
```
Expected: All FAIL (file doesn't exist)

- [ ] **Step 3: Write `scripts/build_data.py`**

```python
"""
Preprocess OECD philanthropy CSV into pre-aggregated JSON files for the dashboard.

Inputs:  data/raw/oecd_philanthropy.csv
         scripts/country_centroids.csv

Outputs: public/data/flows_by_year.json
         public/data/donor_summary.json
         public/data/country_summary.json
         public/data/marker_breakdown.json
         public/data/countries_geo.json
         public/data/filter_options.json
"""
import json, re, os, sys
import pandas as pd
import numpy as np
from geocode_countries import name_to_iso3

# ── Config ─────────────────────────────────────────────────────────────────
CENTROIDS_PATH = "scripts/country_centroids.csv"
RAW_CSV        = "data/raw/oecd_philanthropy.csv"
OUT_DIR        = "public/data"
FLOW_MIN_USD   = 0.01   # include all flows >= $0.01M; slider handles display filtering

MARKER_COLS = {
    "gender":               "gender_marker",
    "climate_mitigation":   "climate_change_mitigation",
    "climate_adaptation":   "climate_change_adaptation",
    "environment":          "environment",
    "biodiversity":         "biodiversity",
    "desertification":      "desertification",
    "nutrition":            "nutrition",
}

SECTOR_MAP = {
    # sector code (int) → display group
    720: "Emergency", 730: "Emergency", 740: "Emergency", 930: "Emergency",
    110: "Education", 111: "Education", 112: "Education", 113: "Education",
    114: "Education",
    120: "Health", 121: "Health", 122: "Health", 123: "Health", 130: "Health",
    410: "Environment", 411: "Environment", 412: "Environment", 430: "Environment",
    440: "Environment",
    230: "Climate", 231: "Climate", 232: "Climate",
    150: "Gov & Civil Society", 151: "Gov & Civil Society", 152: "Gov & Civil Society",
    153: "Gov & Civil Society",
    200: "Economic Dev", 210: "Economic Dev", 211: "Economic Dev", 220: "Economic Dev",
    240: "Economic Dev", 250: "Economic Dev", 260: "Economic Dev",
    310: "Economic Dev", 311: "Economic Dev", 312: "Economic Dev",
    321: "Economic Dev", 331: "Economic Dev",
}


def make_slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_")


def map_sector(code) -> str:
    try:
        return SECTOR_MAP.get(int(code), "Other")
    except (ValueError, TypeError):
        return "Other"


def compute_marker_stats(group: pd.DataFrame, col: str) -> dict:
    total = len(group)
    scored = group[col].notna()
    screened = scored.sum()
    principal  = (group[col] == 2).sum()
    significant = (group[col] == 1).sum()
    not_targeted = (group[col] == 0).sum()
    screened_pct    = round(screened / total, 4) if total else 0
    principal_pct   = round(principal / screened, 4) if screened else 0
    significant_pct = round(significant / screened, 4) if screened else 0
    not_targeted_pct = round(not_targeted / screened, 4) if screened else 0
    credibility_score = round(principal_pct + 0.5 * significant_pct, 4)
    return {
        "screened_pct": screened_pct,
        "principal_pct": principal_pct,
        "significant_pct": significant_pct,
        "not_targeted_pct": not_targeted_pct,
        "credibility_score": credibility_score,
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # ── Load centroids ───────────────────────────────────────────────────────
    centroids = pd.read_csv(CENTROIDS_PATH)
    name_to_iso = {}
    for _, row in centroids.iterrows():
        name_to_iso[row["name"].strip().lower()] = row["iso3"]
        name_to_iso[row["iso3"].lower()] = row["iso3"]
    iso_to_info = {r["iso3"]: r for _, r in centroids.iterrows()}

    def resolve_iso3(country_name: str) -> str | None:
        if not isinstance(country_name, str):
            return None
        key = country_name.strip().lower()
        if key in name_to_iso:
            return name_to_iso[key]
        return name_to_iso3(country_name.strip())

    # ── Load raw CSV ─────────────────────────────────────────────────────────
    df = pd.read_csv(RAW_CSV, low_memory=False)
    raw_rows = len(df)
    print(f"Loaded {raw_rows} rows")

    # ── Exclude NDA-aggregated rows ──────────────────────────────────────────
    nda_mask = df["Year"].astype(str).str.strip() == "2020-2023"
    nda_df = df[nda_mask].copy()
    df = df[~nda_mask].copy()
    df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
    df = df.dropna(subset=["Year"])
    df["Year"] = df["Year"].astype(int)
    print(f"Excluded {nda_mask.sum()} NDA-aggregated rows")

    # ── Map recipient country → ISO3 ─────────────────────────────────────────
    df["recipient_iso3"] = df["country"].apply(resolve_iso3)
    unmapped = df["recipient_iso3"].isna().sum()
    df = df.dropna(subset=["recipient_iso3"])
    print(f"Dropped {unmapped} rows with unmappable recipient countries")

    # ── Standardize donor fields ─────────────────────────────────────────────
    df["donor_name"] = df["organization_name"].str.strip()
    df["donor_id"]   = df["donor_name"].apply(make_slug)
    df["donor_country"] = df["Donor_country"].str.strip()   # full name

    # ── Map sector ───────────────────────────────────────────────────────────
    df["sector_group"] = df["Sector"].apply(map_sector)

    # ── USD amount ───────────────────────────────────────────────────────────
    df["usd"] = pd.to_numeric(df["usd_disbursements_defl"], errors="coerce").fillna(0)

    # ── Recipient name (from country column) ─────────────────────────────────
    df["recipient_name"] = df["country"].str.strip()

    # ── countries_geo.json ───────────────────────────────────────────────────
    iso3s_used = set(df["recipient_iso3"].unique())
    geo = []
    for iso3 in sorted(iso3s_used):
        if iso3 in iso_to_info:
            r = iso_to_info[iso3]
            geo.append({
                "iso3": iso3,
                "name": r["name"],
                "lat": float(r["lat"]),
                "lon": float(r["lon"]),
                "continent": r["continent"],
            })
    _write(OUT_DIR, "countries_geo.json", geo)

    # ── Growth rate per recipient country (2020→2023) ────────────────────────
    totals_by_year = (
        df.groupby(["Year", "recipient_iso3"])["usd"]
        .sum().reset_index().rename(columns={"usd": "total_usd"})
    )
    yr2020 = totals_by_year[totals_by_year["Year"] == 2020].set_index("recipient_iso3")["total_usd"]
    yr2023 = totals_by_year[totals_by_year["Year"] == 2023].set_index("recipient_iso3")["total_usd"]
    def calc_growth(iso3: str):
        v0 = yr2020.get(iso3)
        v1 = yr2023.get(iso3)
        if v0 and v1 and v0 > 0:
            return round((v1 - v0) / v0, 4)
        return None
    growth_map = {iso3: calc_growth(iso3) for iso3 in iso3s_used}

    # ── flows_by_year.json ───────────────────────────────────────────────────
    flow_agg = (
        df.groupby(["Year", "donor_id", "donor_name", "donor_country",
                    "recipient_iso3", "recipient_name"])
        .agg(
            usd_disbursed_m=("usd", "sum"),
            n_projects=("usd", "count"),
        )
        .reset_index()
    )
    # Top sector per (year, donor, recipient)
    top_sec = (
        df.groupby(["Year", "donor_id", "recipient_iso3", "sector_group"])["usd"]
        .sum().reset_index()
        .sort_values("usd", ascending=False)
        .drop_duplicates(["Year", "donor_id", "recipient_iso3"])
        .rename(columns={"sector_group": "top_sector", "usd": "_sec_usd"})
    )
    flow_agg = flow_agg.merge(
        top_sec[["Year", "donor_id", "recipient_iso3", "top_sector"]],
        on=["Year", "donor_id", "recipient_iso3"], how="left"
    )
    flow_agg = flow_agg[flow_agg["usd_disbursed_m"] >= FLOW_MIN_USD]
    flow_agg["growth_rate"] = flow_agg["recipient_iso3"].map(growth_map)
    flow_agg["usd_disbursed_m"] = flow_agg["usd_disbursed_m"].round(4)
    flow_agg["growth_rate"] = flow_agg["growth_rate"].apply(
        lambda x: round(x, 4) if x is not None and not (isinstance(x, float) and np.isnan(x)) else None
    )

    years = sorted(flow_agg["Year"].unique().tolist())
    flows = flow_agg.rename(columns={"Year": "year"}).to_dict(orient="records")
    _write(OUT_DIR, "flows_by_year.json", {"years": years, "flows": flows})

    # ── donor_summary.json ───────────────────────────────────────────────────
    donor_totals = (
        df.groupby(["donor_id", "donor_name", "donor_country"])
        .agg(total_usd_m=("usd", "sum"), n_projects=("usd", "count"))
        .reset_index()
        .sort_values("total_usd_m", ascending=False)
    )
    donor_totals["total_usd_m"] = donor_totals["total_usd_m"].round(4)
    donor_totals["rank"] = range(1, len(donor_totals) + 1)

    top_sectors_by_donor = (
        df.groupby(["donor_id", "sector_group"])["usd"]
        .sum().reset_index()
        .sort_values("usd", ascending=False)
        .groupby("donor_id")
        .head(5)
    )
    top_recipients_by_donor = (
        df.groupby(["donor_id", "recipient_iso3", "recipient_name"])["usd"]
        .sum().reset_index()
        .sort_values("usd", ascending=False)
        .groupby("donor_id")
        .head(5)
    )
    n_countries_by_donor = df.groupby("donor_id")["recipient_iso3"].nunique()

    donors_out = []
    for _, row in donor_totals.iterrows():
        did = row["donor_id"]
        sec = top_sectors_by_donor[top_sectors_by_donor["donor_id"] == did]
        rec = top_recipients_by_donor[top_recipients_by_donor["donor_id"] == did]
        year_range_data = df[df["donor_id"] == did]["Year"]
        donors_out.append({
            "donor_id": did,
            "donor_name": row["donor_name"],
            "donor_country": row["donor_country"],
            "total_usd_m": float(row["total_usd_m"]),
            "n_projects": int(row["n_projects"]),
            "n_countries": int(n_countries_by_donor.get(did, 0)),
            "rank": int(row["rank"]),
            "top_sectors": [{"name": r["sector_group"], "usd_m": round(r["usd"], 4)}
                            for _, r in sec.iterrows()],
            "top_recipients": [{"iso3": r["recipient_iso3"], "name": r["recipient_name"],
                                 "usd_m": round(r["usd"], 4)}
                                for _, r in rec.iterrows()],
            "year_range": [int(year_range_data.min()), int(year_range_data.max())]
              if len(year_range_data) else [2020, 2023],
        })
    _write(OUT_DIR, "donor_summary.json", donors_out)

    # ── country_summary.json ──────────────────────────────────────────────────
    country_totals = (
        df.groupby(["recipient_iso3", "recipient_name"])
        .agg(total_received_usd_m=("usd", "sum"), n_projects=("usd", "count"))
        .reset_index()
    )
    top_donors_by_country = (
        df.groupby(["recipient_iso3", "donor_id", "donor_name"])["usd"]
        .sum().reset_index()
        .sort_values("usd", ascending=False)
        .groupby("recipient_iso3")
        .head(5)
    )
    top_sectors_by_country = (
        df.groupby(["recipient_iso3", "sector_group"])["usd"]
        .sum().reset_index()
        .sort_values("usd", ascending=False)
        .groupby("recipient_iso3")
        .head(5)
    )
    by_year_by_country = (
        df.groupby(["recipient_iso3", "Year"])["usd"]
        .sum().reset_index()
    )
    n_donors_by_country = df.groupby("recipient_iso3")["donor_id"].nunique()

    countries_out = []
    for _, row in country_totals.iterrows():
        iso3 = row["recipient_iso3"]
        donors_c = top_donors_by_country[top_donors_by_country["recipient_iso3"] == iso3]
        secs_c   = top_sectors_by_country[top_sectors_by_country["recipient_iso3"] == iso3]
        byyear   = by_year_by_country[by_year_by_country["recipient_iso3"] == iso3]
        countries_out.append({
            "iso3": iso3,
            "name": row["recipient_name"],
            "total_received_usd_m": round(float(row["total_received_usd_m"]), 4),
            "n_donors": int(n_donors_by_country.get(iso3, 0)),
            "n_projects": int(row["n_projects"]),
            "top_donors": [{"donor_id": r["donor_id"], "donor_name": r["donor_name"],
                             "usd_m": round(r["usd"], 4)}
                           for _, r in donors_c.iterrows()],
            "top_sectors": [{"name": r["sector_group"], "usd_m": round(r["usd"], 4)}
                            for _, r in secs_c.iterrows()],
            "by_year": {str(int(r["Year"])): round(r["usd"], 4)
                        for _, r in byyear.iterrows()},
        })
    _write(OUT_DIR, "country_summary.json", countries_out)

    # ── marker_breakdown.json ────────────────────────────────────────────────
    marker_out = []
    for did in df["donor_id"].unique():
        group = df[df["donor_id"] == did]
        donor_name = group["donor_name"].iloc[0]
        markers = {}
        for key, col in MARKER_COLS.items():
            if col in df.columns:
                group[col] = pd.to_numeric(group[col], errors="coerce")
                markers[key] = compute_marker_stats(group, col)
            else:
                markers[key] = {"screened_pct": 0, "principal_pct": 0,
                                "significant_pct": 0, "not_targeted_pct": 0,
                                "credibility_score": 0}
        marker_out.append({"donor_id": did, "donor_name": donor_name, "markers": markers})
    _write(OUT_DIR, "marker_breakdown.json", marker_out)

    # ── filter_options.json ───────────────────────────────────────────────────
    filter_opts = {
        "donor_countries": sorted(df["donor_country"].dropna().unique().tolist()),
        "sectors": sorted(df["sector_group"].unique().tolist()),
        "year_min": int(df["Year"].min()),
        "year_max": int(df["Year"].max()),
        "markers": list(MARKER_COLS.keys()),
    }
    _write(OUT_DIR, "filter_options.json", filter_opts)

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n=== Pipeline complete ===")
    print(f"Raw rows: {raw_rows} → processed: {len(df)}")
    print(f"NDA rows excluded: {nda_mask.sum()}")
    print(f"Unmapped recipients dropped: {unmapped}")
    print(f"Donors: {len(donors_out)}  Countries: {len(countries_out)}  Years: {years}")
    total_usd = round(df["usd"].sum(), 2)
    print(f"Total USD disbursed: ${total_usd}M")
    for fname in os.listdir(OUT_DIR):
        path = os.path.join(OUT_DIR, fname)
        print(f"  {fname}: {os.path.getsize(path) // 1024}KB")


def _write(dir: str, fname: str, data):
    path = os.path.join(dir, fname)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, allow_nan=False, default=str)
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the pipeline**

```bash
python scripts/build_data.py
```
Expected: Summary stats printed, all 6 JSON files created in `public/data/`

- [ ] **Step 5: Run tests**

```bash
pytest scripts/tests/test_build_data.py -v
```
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/build_data.py scripts/tests/test_build_data.py public/data/
git commit -m "feat: OECD data pipeline producing 6 JSON files"
```

---

### Task 4: `scripts/validate_data.py`

**Files:**
- Create: `scripts/validate_data.py`

- [ ] **Step 1: Write `scripts/validate_data.py`**

```python
"""
Sanity-check all output JSONs before deploy. Exit non-zero on failure.
"""
import json, os, sys

FILES = [
    "public/data/flows_by_year.json",
    "public/data/donor_summary.json",
    "public/data/country_summary.json",
    "public/data/marker_breakdown.json",
    "public/data/countries_geo.json",
    "public/data/filter_options.json",
]
MAX_FILE_SIZE_MB = 5
errors = []

for path in FILES:
    if not os.path.exists(path):
        errors.append(f"MISSING: {path}")
        continue
    size_mb = os.path.getsize(path) / 1_000_000
    if size_mb > MAX_FILE_SIZE_MB:
        errors.append(f"TOO LARGE ({size_mb:.1f}MB): {path}")
    try:
        with open(path) as f:
            data = json.load(f)
        print(f"OK ({size_mb:.2f}MB): {path}")
    except json.JSONDecodeError as e:
        errors.append(f"INVALID JSON {path}: {e}")
        continue

    # File-specific checks
    if "flows_by_year" in path:
        assert "years" in data and "flows" in data
        for flow in data["flows"][:10]:
            assert "donor_country" in flow
            assert len(flow["donor_country"]) > 3, "donor_country must be full name"
            assert "growth_rate" in flow

    if "donor_summary" in path:
        for d in data[:5]:
            assert "rank" in d
            assert "top_sectors" in d

    if "marker_breakdown" in path:
        for d in data[:3]:
            for key in ["gender", "climate_mitigation", "climate_adaptation",
                        "environment", "biodiversity", "desertification", "nutrition"]:
                assert key in d["markers"], f"Missing marker {key}"
            for key, stats in d["markers"].items():
                expected = round(stats["principal_pct"] + 0.5 * stats["significant_pct"], 3)
                assert abs(expected - round(stats["credibility_score"], 3)) < 0.01

    if "filter_options" in path:
        for name in data["donor_countries"]:
            assert len(name) > 3, f"Short donor country name: {name}"

if errors:
    print("\n=== VALIDATION FAILED ===")
    for e in errors:
        print(f"  ERROR: {e}")
    sys.exit(1)
else:
    print("\n=== All validations passed ===")
```

- [ ] **Step 2: Run it**

```bash
python scripts/validate_data.py
```
Expected: "All validations passed"

- [ ] **Step 3: Commit**

```bash
git add scripts/validate_data.py
git commit -m "feat: add data validation script"
```

---

## Phase 2: Frontend Foundation

### Task 5: Frontend scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `vercel.json`, `.env.example`

- [ ] **Step 1: Write config files**

`package.json`:
```json
{
  "name": "philanthroglobe",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
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
    "vite-plugin-cesium": "^1.2.22",
    "vitest": "^1.6.0",
    "@vitest/coverage-v8": "^1.6.0"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  plugins: [react(), cesium()],
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
  },
})
```

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

`postcss.config.js`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PhilanthroGlobe</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

`.env.example`:
```
VITE_CESIUM_ION_TOKEN=your_token_here
```

- [ ] **Step 2: Install deps**

```bash
npm install
```
Expected: `node_modules/` created, no errors

- [ ] **Step 3: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html vercel.json .env.example
git commit -m "feat: frontend scaffold with Vite + React + Cesium + Tailwind"
```

---

### Task 6: TypeScript types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write `src/types/index.ts`**

```typescript
export type Mode = 'crisis' | 'credibility'

export type YearSelection = number | 'all' | 'compare'

export type MarkerKey =
  | 'gender'
  | 'climate_mitigation'
  | 'climate_adaptation'
  | 'environment'
  | 'biodiversity'
  | 'desertification'
  | 'nutrition'

export const MARKER_LABELS: Record<MarkerKey, string> = {
  gender: 'Gender Equality',
  climate_mitigation: 'Climate Mitigation',
  climate_adaptation: 'Climate Adaptation',
  environment: 'Environment',
  biodiversity: 'Biodiversity',
  desertification: 'Desertification',
  nutrition: 'Nutrition',
}

export const ALL_MARKERS: MarkerKey[] = [
  'gender', 'climate_mitigation', 'climate_adaptation',
  'environment', 'biodiversity', 'desertification', 'nutrition',
]

export interface Country {
  iso3: string
  name: string
  lat: number
  lon: number
  continent: string
}

export interface Flow {
  year: number
  donor_id: string
  donor_name: string
  donor_country: string    // full name e.g. "United Kingdom"
  recipient_iso3: string
  recipient_name: string
  usd_disbursed_m: number
  n_projects: number
  top_sector: string
  growth_rate: number | null
}

export interface FlowsData {
  years: number[]
  flows: Flow[]
}

export interface SectorAmount {
  name: string
  usd_m: number
}

export interface RecipientAmount {
  iso3: string
  name: string
  usd_m: number
}

export interface DonorAmount {
  donor_id: string
  donor_name: string
  usd_m: number
}

export interface DonorSummary {
  donor_id: string
  donor_name: string
  donor_country: string    // full name e.g. "United Kingdom"
  total_usd_m: number
  n_projects: number
  n_countries: number
  rank: number | null
  top_sectors: SectorAmount[]
  top_recipients: RecipientAmount[]
  year_range: [number, number]
}

export interface CountrySummary {
  iso3: string
  name: string
  total_received_usd_m: number
  n_donors: number
  n_projects: number
  top_donors: DonorAmount[]
  top_sectors: SectorAmount[]
  by_year: Record<string, number>
}

export interface MarkerStats {
  screened_pct: number
  principal_pct: number
  significant_pct: number
  not_targeted_pct: number
  credibility_score: number
}

export interface MarkerBreakdown {
  donor_id: string
  donor_name: string
  markers: Record<MarkerKey, MarkerStats>
}

export interface CrisisEvent {
  id: string
  name: string
  year: number
  country_iso3: string | null
  lat: number | null
  lon: number | null
  description: string
  highlight_color: string
}

export interface FilterOptions {
  donor_countries: string[]
  sectors: string[]
  year_min: number
  year_max: number
  markers: MarkerKey[]
}

export interface AppData {
  flows: FlowsData
  donors: DonorSummary[]
  countries: CountrySummary[]
  markers: MarkerBreakdown[]
  geo: Country[]
  crisisEvents: CrisisEvent[]
  filterOptions: FilterOptions
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: TypeScript types for all data contracts"
```

---

### Task 7: Zustand store

**Files:**
- Create: `src/state/store.ts`

- [ ] **Step 1: Write `src/state/store.ts`**

```typescript
import { create } from 'zustand'
import type { Mode, YearSelection, MarkerKey } from '../types'

interface AppState {
  // Mode
  mode: Mode
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
}

export const useStore = create<AppState>((set) => ({
  mode: 'crisis',
  setMode: (mode) => set({ mode }),

  yearSelection: 'all',
  setYearSelection: (yearSelection) => set({ yearSelection }),
  compareYears: [2020, 2023],
  setCompareYears: (compareYears) => set({ compareYears }),

  donorCountry: null,
  setDonorCountry: (donorCountry) => set({ donorCountry }),
  sector: null,
  setSector: (sector) => set({ sector }),
  flowSizeMin: 0.01,
  setFlowSizeMin: (flowSizeMin) => set({ flowSizeMin }),

  selectedMarker: 'gender',
  setSelectedMarker: (selectedMarker) => set({ selectedMarker }),

  selectedDonorId: null,
  setSelectedDonorId: (selectedDonorId) => set({ selectedDonorId }),
  selectedCountryIso3: null,
  setSelectedCountryIso3: (selectedCountryIso3) => set({ selectedCountryIso3 }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add src/state/store.ts
git commit -m "feat: Zustand store with all filter and drilldown state"
```

---

### Task 8: `dataLoader.ts` + `filters.ts`

**Files:**
- Create: `src/lib/dataLoader.ts`
- Create: `src/lib/filters.ts`
- Create: `src/lib/filters.test.ts`

- [ ] **Step 1: Write `src/lib/dataLoader.ts`**

```typescript
import type { AppData } from '../types'

let cache: AppData | null = null

export async function loadAppData(): Promise<AppData> {
  if (cache) return cache
  const [flows, donors, countries, markers, geo, crisisEvents, filterOptions] =
    await Promise.all([
      fetch('/data/flows_by_year.json').then((r) => r.json()),
      fetch('/data/donor_summary.json').then((r) => r.json()),
      fetch('/data/country_summary.json').then((r) => r.json()),
      fetch('/data/marker_breakdown.json').then((r) => r.json()),
      fetch('/data/countries_geo.json').then((r) => r.json()),
      fetch('/data/crisis_events.json').then((r) => r.json()),
      fetch('/data/filter_options.json').then((r) => r.json()),
    ])
  cache = { flows, donors, countries, markers, geo, crisisEvents, filterOptions }
  return cache
}
```

- [ ] **Step 2: Write failing tests for `filters.ts`**

```typescript
// src/lib/filters.test.ts
import { describe, it, expect } from 'vitest'
import { applyFilters, getLeaderboardDonors, getLeaderboardCountries } from './filters'
import type { Flow } from '../types'

const makeFlow = (overrides: Partial<Flow> = {}): Flow => ({
  year: 2022,
  donor_id: 'acme_foundation',
  donor_name: 'ACME Foundation',
  donor_country: 'United Kingdom',
  recipient_iso3: 'UKR',
  recipient_name: 'Ukraine',
  usd_disbursed_m: 5.0,
  n_projects: 2,
  top_sector: 'Emergency',
  growth_rate: 0.3,
  ...overrides,
})

const flows: Flow[] = [
  makeFlow({ year: 2022, donor_country: 'United Kingdom', top_sector: 'Emergency', usd_disbursed_m: 5 }),
  makeFlow({ year: 2021, donor_country: 'France', top_sector: 'Education', usd_disbursed_m: 2 }),
  makeFlow({ year: 2020, donor_country: 'United Kingdom', top_sector: 'Health', usd_disbursed_m: 0.005, recipient_iso3: 'KEN' }),
]

describe('applyFilters', () => {
  it('returns all flows when no filters set', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: null, sector: null, flowSizeMin: 0 })
    expect(result).toHaveLength(3)
  })

  it('filters by single year', () => {
    const result = applyFilters(flows, { yearSelection: 2022, donorCountry: null, sector: null, flowSizeMin: 0 })
    expect(result).toHaveLength(1)
    expect(result[0].year).toBe(2022)
  })

  it('filters by donor country', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: 'France', sector: null, flowSizeMin: 0 })
    expect(result).toHaveLength(1)
    expect(result[0].donor_country).toBe('France')
  })

  it('filters by sector', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: null, sector: 'Emergency', flowSizeMin: 0 })
    expect(result).toHaveLength(1)
    expect(result[0].top_sector).toBe('Emergency')
  })

  it('filters by flowSizeMin', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: null, sector: null, flowSizeMin: 1.0 })
    expect(result).toHaveLength(2)
    result.forEach(f => expect(f.usd_disbursed_m).toBeGreaterThanOrEqual(1.0))
  })

  it('combines multiple filters', () => {
    const result = applyFilters(flows, { yearSelection: 'all', donorCountry: 'United Kingdom', sector: 'Emergency', flowSizeMin: 1.0 })
    expect(result).toHaveLength(1)
  })
})

describe('getLeaderboardDonors', () => {
  it('returns top donors sorted by total usd', () => {
    const result = getLeaderboardDonors(flows, 10)
    expect(result[0].total_usd_m).toBeGreaterThanOrEqual(result[1]?.total_usd_m ?? 0)
  })
})

describe('getLeaderboardCountries', () => {
  it('returns top countries sorted by total received', () => {
    const result = getLeaderboardCountries(flows, 10)
    expect(result.length).toBeGreaterThan(0)
    if (result.length > 1) {
      expect(result[0].total_usd_m).toBeGreaterThanOrEqual(result[1].total_usd_m)
    }
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test
```
Expected: FAIL (filters.ts not yet written)

- [ ] **Step 4: Write `src/lib/filters.ts`**

```typescript
import type { Flow } from '../types'

export interface FilterParams {
  yearSelection: number | 'all' | 'compare'
  donorCountry: string | null
  sector: string | null
  flowSizeMin: number
  compareYears?: [number, number]
}

export function applyFilters(flows: Flow[], params: FilterParams): Flow[] {
  return flows.filter((f) => {
    if (params.yearSelection !== 'all' && params.yearSelection !== 'compare') {
      if (f.year !== params.yearSelection) return false
    }
    if (params.yearSelection === 'compare' && params.compareYears) {
      const [y1, y2] = params.compareYears
      if (f.year !== y1 && f.year !== y2) return false
    }
    if (params.donorCountry && f.donor_country !== params.donorCountry) return false
    if (params.sector && f.top_sector !== params.sector) return false
    if (f.usd_disbursed_m < params.flowSizeMin) return false
    return true
  })
}

export interface LeaderboardEntry {
  id: string
  name: string
  total_usd_m: number
  n_flows: number
}

export function getLeaderboardDonors(flows: Flow[], topN: number): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>()
  for (const f of flows) {
    const existing = map.get(f.donor_id)
    if (existing) {
      existing.total_usd_m += f.usd_disbursed_m
      existing.n_flows += 1
    } else {
      map.set(f.donor_id, { id: f.donor_id, name: f.donor_name, total_usd_m: f.usd_disbursed_m, n_flows: 1 })
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.total_usd_m - a.total_usd_m)
    .slice(0, topN)
}

export function getLeaderboardCountries(flows: Flow[], topN: number): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>()
  for (const f of flows) {
    const existing = map.get(f.recipient_iso3)
    if (existing) {
      existing.total_usd_m += f.usd_disbursed_m
      existing.n_flows += 1
    } else {
      map.set(f.recipient_iso3, { id: f.recipient_iso3, name: f.recipient_name, total_usd_m: f.usd_disbursed_m, n_flows: 1 })
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.total_usd_m - a.total_usd_m)
    .slice(0, topN)
}
```

- [ ] **Step 5: Run tests**

```bash
npm test
```
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/dataLoader.ts src/lib/filters.ts src/lib/filters.test.ts
git commit -m "feat: dataLoader, filters with tests"
```

---

### Task 9: `colorScales.ts` + `arcGeometry.ts`

**Files:**
- Create: `src/lib/colorScales.ts`
- Create: `src/lib/arcGeometry.ts`

- [ ] **Step 1: Write `src/lib/colorScales.ts`**

```typescript
import { Color } from 'cesium'

export const SECTOR_COLORS: Record<string, string> = {
  Emergency:          '#e63946',
  Health:             '#2a9d8f',
  Education:          '#457b9d',
  Climate:            '#52b788',
  Environment:        '#40916c',
  'Economic Dev':     '#f4a261',
  'Gov & Civil Society': '#a8dadc',
  Other:              '#adb5bd',
}

export function sectorColor(sector: string): Color {
  const hex = SECTOR_COLORS[sector] ?? SECTOR_COLORS.Other
  return Color.fromCssColorString(hex)
}

// growth_rate: positive = green, negative = red, null/0 = gray
export function growthRateColor(rate: number | null): Color {
  if (rate === null) return Color.fromCssColorString('#9ca3af').withAlpha(0.6)
  if (rate > 0.1)  return Color.fromCssColorString('#22c55e').withAlpha(0.8)
  if (rate > 0)    return Color.fromCssColorString('#86efac').withAlpha(0.7)
  if (rate < -0.1) return Color.fromCssColorString('#ef4444').withAlpha(0.8)
  if (rate < 0)    return Color.fromCssColorString('#fca5a5').withAlpha(0.7)
  return Color.fromCssColorString('#9ca3af').withAlpha(0.6)
}

// credibility_score: 0→1, blue scale
export function credibilityColor(score: number): Color {
  const clamped = Math.max(0, Math.min(1, score))
  const r = Math.round(255 * (1 - clamped * 0.8))
  const g = Math.round(255 * (1 - clamped * 0.5))
  const b = 255
  return Color.fromBytes(r, g, b, 200)
}

// arc thickness: log scale capped at 8px
export function arcWidth(usd_m: number): number {
  return Math.max(1, Math.min(8, 1 + Math.log10(usd_m + 1) * 2.5))
}
```

- [ ] **Step 2: Write `src/lib/arcGeometry.ts`**

```typescript
import { Cartesian3, Math as CesiumMath } from 'cesium'

// Generate N interpolated points along a bezier arc between two lat/lon points.
// The midpoint is elevated to create a curved arc over the globe surface.
export function generateArcPoints(
  fromLat: number, fromLon: number,
  toLat: number,   toLon: number,
  numPoints = 64
): Cartesian3[] {
  const start = Cartesian3.fromDegrees(fromLon, fromLat)
  const end   = Cartesian3.fromDegrees(toLon,   toLat)

  // Midpoint on surface
  const midLat = (fromLat + toLat) / 2
  const midLon = (fromLon + toLon) / 2

  // Elevation proportional to arc length (great-circle distance in degrees)
  const distDeg = Math.sqrt((toLat - fromLat) ** 2 + (toLon - fromLon) ** 2)
  const heightM = Math.min(3_000_000, distDeg * 60_000)

  const mid = Cartesian3.fromDegrees(midLon, midLat, heightM)

  const points: Cartesian3[] = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    // Quadratic bezier: (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
    const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * mid.x + t ** 2 * end.x
    const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * mid.y + t ** 2 * end.y
    const z = (1 - t) ** 2 * start.z + 2 * (1 - t) * t * mid.z + t ** 2 * end.z
    points.push(new Cartesian3(x, y, z))
  }
  return points
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/colorScales.ts src/lib/arcGeometry.ts
git commit -m "feat: color scales and arc geometry utilities"
```

---

## Phase 3: Globe Shell

### Task 10: App shell

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles/globals.css`
- Create: `src/components/Layout/Header.tsx`
- Create: `src/components/Layout/MethodologyFooter.tsx`

- [ ] **Step 1: Write the shell files**

`src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Cesium viewer takes full parent height */
.cesium-viewer, .cesium-widget, .cesium-widget canvas {
  width: 100% !important;
  height: 100% !important;
}
.cesium-viewer-bottom { display: none; }
```

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`src/components/Layout/Header.tsx`:
```tsx
import { ModeToggle } from '../Controls/ModeToggle'

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 z-10">
      <h1 className="text-white font-bold text-lg tracking-wide">PhilanthroGlobe</h1>
      <ModeToggle />
    </header>
  )
}
```

`src/components/Layout/MethodologyFooter.tsx`:
```tsx
export function MethodologyFooter() {
  return (
    <footer className="px-4 py-1 bg-gray-900 border-t border-gray-700 text-gray-400 text-xs space-y-0.5">
      <p>Source: OECD Private Philanthropy for Development. NDA-aggregated rows excluded from time-series.</p>
      <p>Markers: 0=not targeted, 1=significant, 2=principal. NULL=not screened.</p>
      <p>Credibility = principal_pct + 0.5 × significant_pct. Higher = better alignment.</p>
    </footer>
  )
}
```

`src/App.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { loadAppData } from './lib/dataLoader'
import type { AppData } from './types'
import { Header } from './components/Layout/Header'
import { MethodologyFooter } from './components/Layout/MethodologyFooter'
import { LeftSidebar } from './components/Sidebar/LeftSidebar'
import { CesiumGlobe } from './components/Globe/CesiumGlobe'
import { Panel } from './components/Panel/Panel'
import { DonorPanel } from './components/Panel/DonorPanel'
import { CountryPanel } from './components/Panel/CountryPanel'
import { YearControls } from './components/Controls/YearControls'
import { MarkerSelector } from './components/Controls/MarkerSelector'
import { useStore } from './state/store'

export default function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { selectedDonorId, setSelectedDonorId, selectedCountryIso3, setSelectedCountryIso3, mode } = useStore()

  useEffect(() => {
    loadAppData().then(setData).catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-500 p-8">{error}</div>
  if (!data)  return <div className="text-white p-8">Loading data…</div>

  const selectedDonor  = selectedDonorId   ? data.donors.find(d => d.donor_id === selectedDonorId) ?? null : null
  const selectedCountry = selectedCountryIso3 ? data.countries.find(c => c.iso3 === selectedCountryIso3) ?? null : null
  const markerData     = selectedDonorId   ? data.markers.find(m => m.donor_id === selectedDonorId) ?? null : null

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar data={data} />
        <div className="flex-1 relative">
          <CesiumGlobe data={data} />
        </div>
        {(selectedDonor || selectedCountry) && (
          <Panel
            title={selectedDonor?.donor_name ?? selectedCountry?.name ?? ''}
            onClose={() => { setSelectedDonorId(null); setSelectedCountryIso3(null) }}
          >
            {selectedDonor  && <DonorPanel donor={selectedDonor} markerData={markerData} />}
            {selectedCountry && !selectedDonor && <CountryPanel country={selectedCountry} />}
          </Panel>
        )}
      </div>
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 border-t border-gray-700">
        <YearControls />
        {mode === 'credibility' && <MarkerSelector />}
      </div>
      <MethodologyFooter />
    </div>
  )
}
```

- [ ] **Step 2: Run dev server to verify shell loads**

```bash
npm run dev
```
Expected: No TypeScript errors at compile time (some missing component imports will error — fix by creating empty stub components if needed). App loads at http://localhost:5173 showing "Loading data…"

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat: app shell with header, footer, layout"
```

---

### Task 11: `CesiumGlobe.tsx`

**Files:**
- Create: `src/components/Globe/CesiumGlobe.tsx`

- [ ] **Step 1: Write `src/components/Globe/CesiumGlobe.tsx`**

```tsx
import { useRef } from 'react'
import { Viewer, CameraFlyTo } from 'resium'
import { Ion, Cartesian3, Math as CesiumMath, ScreenSpaceEventType } from 'cesium'
import type { AppData } from '../../types'
import { ArcLayer } from './ArcLayer'
import { CrisisAnnotations } from './CrisisAnnotations'
import { useStore } from '../../state/store'

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN ?? ''

interface Props { data: AppData }

export function CesiumGlobe({ data }: Props) {
  const viewerRef = useRef<{ cesiumElement: Cesium.Viewer } | null>(null)
  const { setSelectedDonorId, setSelectedCountryIso3 } = useStore()

  return (
    <Viewer
      ref={viewerRef}
      full
      timeline={false}
      animation={false}
      baseLayerPicker={false}
      homeButton={false}
      sceneModePicker={false}
      navigationHelpButton={false}
      geocoder={false}
      infoBox={false}
      selectionIndicator={false}
      onClick={(movement) => {
        // Entity clicks are handled by individual entity onClick props
        // This handles deselect on empty click
        const viewer = viewerRef.current?.cesiumElement
        if (!viewer) return
        const picked = viewer.scene.pick(movement.position)
        if (!picked) {
          setSelectedDonorId(null)
          setSelectedCountryIso3(null)
        }
      }}
    >
      <ArcLayer data={data} />
      <CrisisAnnotations events={data.crisisEvents} geo={data.geo} />
    </Viewer>
  )
}
```

- [ ] **Step 2: Verify globe renders**

```bash
npm run dev
```
Open http://localhost:5173. Expected: Earth globe renders. If you see a black screen, check `.env` has `VITE_CESIUM_ION_TOKEN` set.

- [ ] **Step 3: Commit**

```bash
git add src/components/Globe/CesiumGlobe.tsx
git commit -m "feat: Cesium globe viewer"
```

---

### Task 12: `ArcLayer.tsx`

**Files:**
- Create: `src/components/Globe/ArcLayer.tsx`

- [ ] **Step 1: Write `src/components/Globe/ArcLayer.tsx`**

```tsx
import { Entity, PolylineGraphics } from 'resium'
import { useStore } from '../../state/store'
import type { AppData, Flow } from '../../types'
import { applyFilters } from '../../lib/filters'
import { generateArcPoints } from '../../lib/arcGeometry'
import { sectorColor, growthRateColor, credibilityColor, arcWidth } from '../../lib/colorScales'

interface Props { data: AppData }

export function ArcLayer({ data }: Props) {
  const { mode, yearSelection, compareYears, donorCountry, sector, flowSizeMin, selectedMarker, setSelectedDonorId } = useStore()

  const geoMap = new Map(data.geo.map(c => [c.iso3, c]))
  const donorGeoMap = new Map(data.donors.map(d => [d.donor_id, d.donor_country]))
  const donorCountryGeoMap = new Map(
    data.donors.flatMap(d => {
      const geo = data.geo.find(g => g.name === d.donor_country || g.iso3 === d.donor_country)
      return geo ? [[d.donor_id, geo]] : []
    })
  )
  const markerMap = new Map(data.markers.map(m => [m.donor_id, m]))

  const filtered = applyFilters(data.flows.flows, {
    yearSelection, compareYears, donorCountry, sector, flowSizeMin,
  })

  return (
    <>
      {filtered.map((flow, i) => {
        const fromGeo = donorCountryGeoMap.get(flow.donor_id)
        const toGeo   = geoMap.get(flow.recipient_iso3)
        if (!fromGeo || !toGeo) return null

        const points = generateArcPoints(fromGeo.lat, fromGeo.lon, toGeo.lat, toGeo.lon)
        const width  = arcWidth(flow.usd_disbursed_m)

        let color
        if (mode === 'credibility') {
          const markerData = markerMap.get(flow.donor_id)
          const score = markerData?.markers[selectedMarker]?.credibility_score ?? 0
          color = credibilityColor(score)
        } else if (yearSelection === 'all') {
          color = growthRateColor(flow.growth_rate)
        } else {
          color = sectorColor(flow.top_sector)
        }

        return (
          <Entity
            key={`${flow.donor_id}-${flow.recipient_iso3}-${flow.year}-${i}`}
            onClick={() => setSelectedDonorId(flow.donor_id)}
          >
            <PolylineGraphics
              positions={points}
              width={width}
              material={color}
              arcType={0}  // NONE — we're handling the curve ourselves
            />
          </Entity>
        )
      })}
    </>
  )
}
```

- [ ] **Step 2: Verify arcs appear on globe**

```bash
npm run dev
```
Open http://localhost:5173. Expected: Colored arcs visible on globe connecting donor countries to recipient countries.

- [ ] **Step 3: Commit**

```bash
git add src/components/Globe/ArcLayer.tsx
git commit -m "feat: arc layer rendering flows on Cesium globe"
```

---

## Phase 4: Controls + Sidebar

### Task 13: Left sidebar + filter controls

**Files:**
- Create: `src/components/Sidebar/LeftSidebar.tsx`
- Create: `src/components/Controls/DonorCountryFilter.tsx`
- Create: `src/components/Controls/SectorFilter.tsx`
- Create: `src/components/Controls/FlowSizeSlider.tsx`

- [ ] **Step 1: Write filter controls**

`src/components/Controls/DonorCountryFilter.tsx`:
```tsx
import { useStore } from '../../state/store'

interface Props { options: string[] }

export function DonorCountryFilter({ options }: Props) {
  const { donorCountry, setDonorCountry } = useStore()
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide">Donor Country</label>
      <select
        className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
        value={donorCountry ?? ''}
        onChange={(e) => setDonorCountry(e.target.value || null)}
      >
        <option value="">All countries</option>
        {options.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  )
}
```

`src/components/Controls/SectorFilter.tsx`:
```tsx
import { useStore } from '../../state/store'

interface Props { options: string[] }

export function SectorFilter({ options }: Props) {
  const { sector, setSector } = useStore()
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide">Sector</label>
      <select
        className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
        value={sector ?? ''}
        onChange={(e) => setSector(e.target.value || null)}
      >
        <option value="">All sectors</option>
        {options.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
```

`src/components/Controls/FlowSizeSlider.tsx`:
```tsx
import { useStore } from '../../state/store'

const STEPS = [0.01, 0.1, 0.5, 1, 2, 5, 10, 25, 50]

export function FlowSizeSlider() {
  const { flowSizeMin, setFlowSizeMin } = useStore()
  const idx = STEPS.findIndex((s) => s >= flowSizeMin)
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide">
        Min flow size: <span className="text-white">${flowSizeMin}M+</span>
      </label>
      <input
        type="range"
        min={0}
        max={STEPS.length - 1}
        value={Math.max(0, idx)}
        onChange={(e) => setFlowSizeMin(STEPS[Number(e.target.value)])}
        className="w-full accent-blue-500"
      />
    </div>
  )
}
```

`src/components/Sidebar/LeftSidebar.tsx`:
```tsx
import type { AppData } from '../../types'
import { DonorCountryFilter } from '../Controls/DonorCountryFilter'
import { SectorFilter } from '../Controls/SectorFilter'
import { FlowSizeSlider } from '../Controls/FlowSizeSlider'
import { Leaderboard } from './Leaderboard'

interface Props { data: AppData }

export function LeftSidebar({ data }: Props) {
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-700 flex flex-col gap-4 p-3 overflow-y-auto shrink-0">
      <DonorCountryFilter options={data.filterOptions.donor_countries} />
      <SectorFilter options={data.filterOptions.sectors} />
      <FlowSizeSlider />
      <hr className="border-gray-700" />
      <Leaderboard data={data} />
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar/LeftSidebar.tsx src/components/Controls/
git commit -m "feat: left sidebar with filter controls"
```

---

### Task 14: `YearControls.tsx`

**Files:**
- Create: `src/components/Controls/YearControls.tsx`

- [ ] **Step 1: Write `src/components/Controls/YearControls.tsx`**

```tsx
import { useStore } from '../../state/store'

const YEARS = [2020, 2021, 2022, 2023]

export function YearControls() {
  const { yearSelection, setYearSelection, compareYears, setCompareYears } = useStore()

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {YEARS.map((y) => (
        <button
          key={y}
          onClick={() => setYearSelection(y)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            yearSelection === y
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {y}
        </button>
      ))}
      <button
        onClick={() => setYearSelection('all')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          yearSelection === 'all'
            ? 'bg-green-600 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        All
      </button>
      <button
        onClick={() => setYearSelection('compare')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          yearSelection === 'compare'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        Compare ⇄
      </button>
      {yearSelection === 'compare' && (
        <div className="flex items-center gap-2 ml-2">
          <select
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
            value={compareYears[0]}
            onChange={(e) => setCompareYears([Number(e.target.value), compareYears[1]])}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-gray-400">→</span>
          <select
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
            value={compareYears[1]}
            onChange={(e) => setCompareYears([compareYears[0], Number(e.target.value)])}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Controls/YearControls.tsx
git commit -m "feat: year controls with pills, All trend mode, Compare mode"
```

---

### Task 15: `ModeToggle.tsx` + `MarkerSelector.tsx`

**Files:**
- Create: `src/components/Controls/ModeToggle.tsx`
- Create: `src/components/Controls/MarkerSelector.tsx`

- [ ] **Step 1: Write the files**

`src/components/Controls/ModeToggle.tsx`:
```tsx
import { useStore } from '../../state/store'

export function ModeToggle() {
  const { mode, setMode } = useStore()
  return (
    <div className="flex rounded-full overflow-hidden border border-gray-600">
      {(['crisis', 'credibility'] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`px-4 py-1 text-sm font-medium capitalize transition-colors ${
            mode === m
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {m === 'crisis' ? 'Crisis Response' : 'Marker Credibility'}
        </button>
      ))}
    </div>
  )
}
```

`src/components/Controls/MarkerSelector.tsx`:
```tsx
import { useStore } from '../../state/store'
import { MARKER_LABELS, ALL_MARKERS } from '../../types'

export function MarkerSelector() {
  const { selectedMarker, setSelectedMarker } = useStore()
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-400">Marker:</label>
      <select
        className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
        value={selectedMarker}
        onChange={(e) => setSelectedMarker(e.target.value as typeof selectedMarker)}
      >
        {ALL_MARKERS.map((m) => (
          <option key={m} value={m}>{MARKER_LABELS[m]}</option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Controls/ModeToggle.tsx src/components/Controls/MarkerSelector.tsx
git commit -m "feat: mode toggle and marker selector controls"
```

---

## Phase 5: Data Interactions

### Task 16: `Leaderboard.tsx`

**Files:**
- Create: `src/components/Sidebar/Leaderboard.tsx`

- [ ] **Step 1: Write `src/components/Sidebar/Leaderboard.tsx`**

```tsx
import { useState } from 'react'
import { useStore } from '../../state/store'
import { applyFilters, getLeaderboardDonors, getLeaderboardCountries } from '../../lib/filters'
import type { AppData } from '../../types'

interface Props { data: AppData }

export function Leaderboard({ data }: Props) {
  const [tab, setTab] = useState<'donors' | 'countries'>('donors')
  const { yearSelection, compareYears, donorCountry, sector, flowSizeMin, setSelectedDonorId, setSelectedCountryIso3 } = useStore()

  const filtered = applyFilters(data.flows.flows, { yearSelection, compareYears, donorCountry, sector, flowSizeMin })
  const entries = tab === 'donors'
    ? getLeaderboardDonors(filtered, 10)
    : getLeaderboardCountries(filtered, 10)

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(['donors', 'countries'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs py-1 rounded transition-colors capitalize ${
              tab === t ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">Top 10 {tab}</p>
      <ol className="space-y-1">
        {entries.map((e, i) => (
          <li
            key={e.id}
            onClick={() => {
              if (tab === 'donors') setSelectedDonorId(e.id)
              else setSelectedCountryIso3(e.id)
            }}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 rounded px-1 py-0.5 transition-colors"
          >
            <span className="text-gray-500 text-xs w-4">{i + 1}</span>
            <span className="text-white text-xs flex-1 truncate">{e.name}</span>
            <span className="text-blue-400 text-xs">${e.total_usd_m.toFixed(1)}M</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar/Leaderboard.tsx
git commit -m "feat: leaderboard reactive to all filters"
```

---

### Task 17: `Panel.tsx` (generic)

**Files:**
- Create: `src/components/Panel/Panel.tsx`

- [ ] **Step 1: Write `src/components/Panel/Panel.tsx`**

```tsx
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Panel({ title, onClose, children }: Props) {
  return (
    <aside className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-white font-semibold text-sm truncate">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {children}
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Panel/Panel.tsx
git commit -m "feat: generic Panel slide-in container"
```

---

### Task 18: `DonorPanel.tsx` + `CountryPanel.tsx`

**Files:**
- Create: `src/components/Panel/DonorPanel.tsx`
- Create: `src/components/Panel/CountryPanel.tsx`

- [ ] **Step 1: Write `src/components/Panel/DonorPanel.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { DonorSummary, MarkerBreakdown } from '../../types'
import { useStore } from '../../state/store'
import { MarkerCredibilityCard } from './MarkerCredibilityCard'
import { SECTOR_COLORS } from '../../lib/colorScales'

interface Props {
  donor: DonorSummary
  markerData: MarkerBreakdown | null
}

export function DonorPanel({ donor, markerData }: Props) {
  const { mode } = useStore()
  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-1">
        <p className="text-gray-400">Country: <span className="text-white">{donor.donor_country}</span></p>
        <p className="text-gray-400">Total disbursed: <span className="text-blue-400 font-bold">${donor.total_usd_m.toFixed(1)}M</span></p>
        <p className="text-gray-400">Projects: <span className="text-white">{donor.n_projects}</span></p>
        <p className="text-gray-400">Countries reached: <span className="text-white">{donor.n_countries}</span></p>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Top Sectors</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={donor.top_sectors} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#d1d5db', fontSize: 10 }} width={80} />
            <Tooltip formatter={(v: number) => `$${v.toFixed(1)}M`} contentStyle={{ background: '#1f2937', border: 'none' }} />
            <Bar dataKey="usd_m">
              {donor.top_sectors.map((s) => (
                <Cell key={s.name} fill={SECTOR_COLORS[s.name] ?? '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Top Recipients</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={donor.top_recipients} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#d1d5db', fontSize: 10 }} width={80} />
            <Tooltip formatter={(v: number) => `$${v.toFixed(1)}M`} contentStyle={{ background: '#1f2937', border: 'none' }} />
            <Bar dataKey="usd_m" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {mode === 'credibility' && markerData && (
        <MarkerCredibilityCard markerData={markerData} />
      )}
    </div>
  )
}
```

`src/components/Panel/CountryPanel.tsx`:
```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import type { CountrySummary } from '../../types'
import { SECTOR_COLORS } from '../../lib/colorScales'
import { Cell } from 'recharts'

interface Props { country: CountrySummary }

export function CountryPanel({ country }: Props) {
  const yearData = Object.entries(country.by_year)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, usd_m]) => ({ year, usd_m }))

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-1">
        <p className="text-gray-400">Total received: <span className="text-blue-400 font-bold">${country.total_received_usd_m.toFixed(1)}M</span></p>
        <p className="text-gray-400">Donors: <span className="text-white">{country.n_donors}</span></p>
        <p className="text-gray-400">Projects: <span className="text-white">{country.n_projects}</span></p>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Funding Over Time</p>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={yearData} margin={{ left: 8, right: 8 }}>
            <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip formatter={(v: number) => `$${v.toFixed(1)}M`} contentStyle={{ background: '#1f2937', border: 'none' }} />
            <Line type="monotone" dataKey="usd_m" stroke="#3b82f6" dot={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Top Sectors</p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={country.top_sectors} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#d1d5db', fontSize: 10 }} width={80} />
            <Tooltip formatter={(v: number) => `$${v.toFixed(1)}M`} contentStyle={{ background: '#1f2937', border: 'none' }} />
            <Bar dataKey="usd_m">
              {country.top_sectors.map((s) => (
                <Cell key={s.name} fill={SECTOR_COLORS[s.name] ?? '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Top Donors</p>
        <ol className="space-y-1">
          {country.top_donors.map((d, i) => (
            <li key={d.donor_id} className="flex justify-between text-xs">
              <span className="text-gray-300">{i + 1}. {d.donor_name}</span>
              <span className="text-blue-400">${d.usd_m.toFixed(1)}M</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Panel/DonorPanel.tsx src/components/Panel/CountryPanel.tsx
git commit -m "feat: donor and country drilldown panels with Recharts"
```

---

### Task 19: `MarkerCredibilityCard.tsx`

**Files:**
- Create: `src/components/Panel/MarkerCredibilityCard.tsx`

- [ ] **Step 1: Write `src/components/Panel/MarkerCredibilityCard.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { MarkerBreakdown } from '../../types'
import { MARKER_LABELS, ALL_MARKERS } from '../../types'

interface Props { markerData: MarkerBreakdown }

export function MarkerCredibilityCard({ markerData }: Props) {
  const chartData = ALL_MARKERS.map((key) => ({
    name: MARKER_LABELS[key],
    score: markerData.markers[key]?.credibility_score ?? 0,
  }))

  return (
    <div>
      <p className="text-gray-400 text-xs uppercase mb-2">Marker Credibility Scores</p>
      <p className="text-gray-500 text-xs mb-2">principal_pct + 0.5 × significant_pct</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
          <XAxis type="number" domain={[0, 1]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <YAxis dataKey="name" type="category" tick={{ fill: '#d1d5db', fontSize: 9 }} width={110} />
          <Tooltip formatter={(v: number) => v.toFixed(2)} contentStyle={{ background: '#1f2937', border: 'none' }} />
          <Bar dataKey="score">
            {chartData.map((d) => (
              <Cell key={d.name} fill={d.score > 0.5 ? '#3b82f6' : d.score > 0.25 ? '#60a5fa' : '#93c5fd'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Panel/MarkerCredibilityCard.tsx
git commit -m "feat: marker credibility horizontal bar card"
```

---

## Phase 6: Advanced Features

### Task 20: `CrisisAnnotations.tsx` + `crisis_events.json`

**Files:**
- Create: `src/components/Globe/CrisisAnnotations.tsx`
- Create: `public/data/crisis_events.json`

- [ ] **Step 1: Write `public/data/crisis_events.json`**

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
    "lat": 30.0,
    "lon": 114.3,
    "description": "Global health emergency triggered cross-sector philanthropic response.",
    "highlight_color": "#3a86ff"
  }
]
```

- [ ] **Step 2: Write `src/components/Globe/CrisisAnnotations.tsx`**

```tsx
import { useState } from 'react'
import { Entity, BillboardGraphics, LabelGraphics } from 'resium'
import { Cartesian3, Color, VerticalOrigin } from 'cesium'
import type { CrisisEvent, Country } from '../../types'
import { useStore } from '../../state/store'

interface Props {
  events: CrisisEvent[]
  geo: Country[]
}

export function CrisisAnnotations({ events, geo }: Props) {
  const { yearSelection } = useStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const geoMap = new Map(geo.map(c => [c.iso3, c]))

  const visible = events.filter((e) => {
    if (yearSelection === 'all') return true
    if (yearSelection === 'compare') return true
    return e.year === yearSelection
  })

  return (
    <>
      {visible.map((event) => {
        const lat = event.lat ?? geoMap.get(event.country_iso3 ?? '')?.lat ?? 0
        const lon = event.lon ?? geoMap.get(event.country_iso3 ?? '')?.lon ?? 0
        const position = Cartesian3.fromDegrees(lon, lat, 50_000)
        const isExpanded = expandedId === event.id

        return (
          <Entity
            key={event.id}
            position={position}
            onClick={() => setExpandedId(isExpanded ? null : event.id)}
          >
            <BillboardGraphics
              image={createPinDataUrl(event.highlight_color)}
              verticalOrigin={VerticalOrigin.BOTTOM}
              scale={0.6}
            />
            {isExpanded && (
              <LabelGraphics
                text={`${event.name}\n${event.year}\n${event.description}`}
                fillColor={Color.WHITE}
                backgroundColor={Color.fromCssColorString('#1f2937').withAlpha(0.9)}
                showBackground
                scale={0.5}
                verticalOrigin={VerticalOrigin.BOTTOM}
                pixelOffset={new Cartesian3(0, -60, 0) as any}
              />
            )}
          </Entity>
        )
      })}
    </>
  )
}

function createPinDataUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.9"/>
    <line x1="12" y1="22" x2="12" y2="36" stroke="${color}" stroke-width="2"/>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Globe/CrisisAnnotations.tsx public/data/crisis_events.json
git commit -m "feat: crisis event annotations on globe"
```

---

### Task 21: Compare mode arc coloring

The Compare mode arcs are already partially handled in `ArcLayer.tsx` — when `yearSelection === 'compare'`, flows from both years are shown. Add delta coloring: flows only in `compareYears[1]` (new) appear green; flows only in `compareYears[0]` (disappeared) appear red; flows in both appear gray.

**Files:**
- Modify: `src/components/Globe/ArcLayer.tsx`

- [ ] **Step 1: Update color logic in `ArcLayer.tsx` for compare mode**

Add this helper above the component and update the color section:

```typescript
// Add this import at top of ArcLayer.tsx
import type { Flow } from '../../types'

// Add this helper function
function getCompareColor(
  flow: Flow,
  allFlows: Flow[],
  compareYears: [number, number]
): CesiumColor {
  const [y1, y2] = compareYears
  const key = `${flow.donor_id}|${flow.recipient_iso3}`
  const inY1 = allFlows.some(f => f.year === y1 && `${f.donor_id}|${f.recipient_iso3}` === key)
  const inY2 = allFlows.some(f => f.year === y2 && `${f.donor_id}|${f.recipient_iso3}` === key)

  if (flow.year === y2 && !inY1) return Color.fromCssColorString('#22c55e').withAlpha(0.8) // new
  if (flow.year === y1 && !inY2) return Color.fromCssColorString('#ef4444').withAlpha(0.8) // gone
  return Color.fromCssColorString('#9ca3af').withAlpha(0.5) // stable
}
```

In the `ArcLayer` component body, update the color selection block:
```typescript
// Replace the existing color logic block with:
let color: CesiumColor
if (mode === 'credibility') {
  const markerData = markerMap.get(flow.donor_id)
  const score = markerData?.markers[selectedMarker]?.credibility_score ?? 0
  color = credibilityColor(score)
} else if (yearSelection === 'compare') {
  color = getCompareColor(flow, data.flows.flows, compareYears)
} else if (yearSelection === 'all') {
  color = growthRateColor(flow.growth_rate)
} else {
  color = sectorColor(flow.top_sector)
}
```

Add `import { Color as CesiumColor } from 'cesium'` if not already imported.

- [ ] **Step 2: Verify compare mode in browser**

Select "Compare ⇄", set years to 2020 → 2022. Expected: green arcs = new flows in 2022, red = disappeared, gray = stable.

- [ ] **Step 3: Commit**

```bash
git add src/components/Globe/ArcLayer.tsx
git commit -m "feat: compare mode delta arc coloring"
```

---

## Phase 7: Deploy

### Task 22: Vercel deploy

- [ ] **Step 1: Verify build passes**

```bash
npm run build
```
Expected: No TypeScript errors, `dist/` created

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 3: Connect Vercel**

1. Go to https://vercel.com/new
2. Import the GitHub repo
3. Add environment variable: `VITE_CESIUM_ION_TOKEN` = your token
4. Deploy

Expected: Public URL created, globe loads at the URL

- [ ] **Step 4: Verify live app**

Open the Vercel URL. Check:
- Globe renders (not a black screen)
- Filters populate from dropdown
- Leaderboard updates when filter changes
- Click an arc → DonorPanel opens
- Year pills switch year

- [ ] **Step 5: Commit**

```bash
git add vercel.json
git commit -m "chore: verified Vercel deploy"
```

---

---

## Implementation Notes (Self-Review Fixes)

### Fix 1: Donor country coordinates missing from `countries_geo.json`

`countries_geo.json` is built from recipient countries only. Donor countries (UK, France, USA…) often do not appear as recipients, so `ArcLayer.tsx` would fail to find arc start coordinates.

**Fix in `build_data.py`:** After building `iso3s_used` from recipient countries, also add donor country ISO3s:

```python
# After iso3s_used = set(df["recipient_iso3"].unique())
# Also resolve donor countries and add them to geo
for donor_country_name in df["donor_country"].dropna().unique():
    iso3 = resolve_iso3(donor_country_name)
    if iso3:
        iso3s_used.add(iso3)
```

And in `donor_summary.json`, store `donor_iso3` alongside `donor_country`:

```python
# When building donors_out, add:
"donor_iso3": resolve_iso3(row["donor_country"]) or "",
```

### Fix 2: `ArcLayer.tsx` arc start coordinate lookup

Use `donor_iso3` from `DonorSummary` (not fuzzy name matching) for the arc start:

```typescript
// In ArcLayer.tsx, replace donorCountryGeoMap build with:
const donorIso3Map = new Map(data.donors.map(d => [d.donor_id, (d as any).donor_iso3 as string]))
// Then in the render loop:
const fromGeo = geoMap.get(donorIso3Map.get(flow.donor_id) ?? '')
```

Add `donor_iso3: string` to the `DonorSummary` type in `src/types/index.ts`.

### Fix 3: `ArcType` import in `ArcLayer.tsx`

Replace `arcType={0}` with the proper enum:
```typescript
import { ..., ArcType } from 'cesium'
// ...
<PolylineGraphics arcType={ArcType.NONE} ... />
```

### Fix 4: `PolylineGraphics` material type

Cesium `PolylineGraphics.material` expects a `MaterialProperty`, not a raw `Color`. Use `ColorMaterialProperty`:

```typescript
import { ColorMaterialProperty } from 'cesium'
// ...
material={new ColorMaterialProperty(color)}
```

---

## Cut Line

**Steps 1–21 = full competition-ready app.** If time is short, cut in reverse order from Task 21:

| Cut | What's lost |
|---|---|
| Skip Task 21 | Compare mode shows arcs but no delta coloring (still functional) |
| Skip Task 20 | No crisis event pins |
| Skip Task 19 | Credibility mode shows arc colors but no detail card |
| Skip Task 18 | Panels open but no charts |

Tasks 1–17 alone produce a globe with filters, leaderboard, drilldown panels, and year controls.

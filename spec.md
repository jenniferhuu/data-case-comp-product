\## Repository Layout



You have two options. I recommend \*\*two separate repos\*\* since they deploy independently and have zero shared code.



\### Option A: Two repos (recommended)



```

\~/hackathon/

├── readiness-paradox/          # Track 1

└── philanthroglobe/            # Track 2

```



\### Option B: Monorepo



```

\~/hackathon/

├── README.md

├── track1-readiness-paradox/

└── track2-philanthroglobe/

```



I'll write the rest assuming Option A. Adjust paths if you go with B.



\---



\## Files to Add to Each Repo Before Starting Claude Code



\### `readiness-paradox/` (Track 1)



```

readiness-paradox/

├── SPEC.md                     ← paste Track 1 section of this doc

├── DATA\_DICTIONARY.md          ← paste your earlier data dictionary message

├── README.md                   ← short, written by you

├── requirements.txt            ← created below

├── .gitignore                  ← created below

├── .claude/

│   └── settings.json           ← optional, for Claude Code preferences

└── data/

&#x20;   └── raw/

&#x20;       └── giving\_tuesday\_2024.csv    ← drop the dataset here once received

```



\### `philanthroglobe/` (Track 2)



```

philanthroglobe/

├── SPEC.md                     ← paste Track 2 section of this doc

├── DATA\_DICTIONARY.md          ← paste OECD column descriptions

├── README.md                   ← short, written by you

├── package.json                ← Claude Code creates from spec

├── .gitignore                  ← created below

├── .env.example                ← created below

├── .claude/

│   └── settings.json           ← optional

├── data/

│   └── raw/

│       └── oecd\_philanthropy.csv      ← drop dataset here once received

└── public/

&#x20;   └── data/                   ← (will be filled by build\_data.py)

```



\---



\## Standard Files to Create



\### `.gitignore` (both repos)



```

\# Python

\_\_pycache\_\_/

\*.py\[cod]

\*$py.class

.venv/

venv/

.ipynb\_checkpoints/



\# Node

node\_modules/

dist/

build/

.next/



\# Data (don't commit raw data)

data/raw/\*.csv

data/processed/\*.parquet

data/processed/\*.csv



\# OS

.DS\_Store

Thumbs.db



\# Editor

.vscode/

.idea/



\# Env

.env

.env.local



\# Outputs

deliverables/\*.mp4

\*.tmp

```



\### `requirements.txt` (Track 1)



```

pandas==2.2.2

numpy==1.26.4

scipy==1.13.1

statsmodels==0.14.2

scikit-learn==1.5.0

matplotlib==3.9.0

seaborn==0.13.2

pyarrow==16.1.0

jupyter==1.0.0

```



\### `.env.example` (Track 2)



```

VITE\_CESIUM\_ION\_TOKEN=your\_token\_here

```



\### `.claude/settings.json` (optional, both repos)



```json

{

&#x20; "permissions": {

&#x20;   "allow": \[

&#x20;     "Bash(npm run \*)",

&#x20;     "Bash(python \*)",

&#x20;     "Bash(pip install \*)",

&#x20;     "Bash(git \*)",

&#x20;     "Edit",

&#x20;     "Write"

&#x20;   ]

&#x20; }

}

```



\---



\# TRACK 1 SPEC



\## Project: The Readiness Paradox



\### Mission



Produce an 8-12 slide video presentation showing that nonprofit AI adoption is predicted by personal comfort with AI, not by data infrastructure. Counter the conventional funder thesis using the Giving Tuesday 2024 survey.



\### Hard constraints



\- No external data

\- 8-12 slides, minimal text on slides

\- Recorded video output

\- Submission deadline: Monday April 27, 11:59pm



\### Deliverables



1\. Cleaned analysis dataset (`data/processed/analysis\_ready.parquet`)

2\. Full Python analysis pipeline (`analysis/run\_all.py`)

3\. Five publication-quality figures (`figures/\*.png`)

4\. Slide deck (`deliverables/slides\_final.pptx`)

5\. Voiceover script (`deliverables/voiceover\_script.md`)

6\. Final video (`deliverables/video\_final.mp4`)

7\. Methods appendix (`deliverables/methods\_appendix.md`)



\### Repository structure (final state)



```

readiness-paradox/

├── SPEC.md

├── DATA\_DICTIONARY.md

├── README.md

├── requirements.txt

├── .gitignore

│

├── data/

│   ├── raw/

│   │   └── giving\_tuesday\_2024.csv

│   └── processed/

│       └── analysis\_ready.parquet

│

├── analysis/

│   ├── 00\_load\_and\_clean.py

│   ├── 01\_feature\_engineering.py

│   ├── 02\_descriptives.py

│   ├── 03\_main\_regression.py

│   ├── 04\_stratification.py

│   ├── 05\_quote\_selection.py

│   └── run\_all.py

│

├── figures/

│   ├── fig1\_dual\_scatter.png

│   ├── fig2\_coef\_bar.png

│   ├── fig3\_stratification.png

│   ├── fig4\_quote\_card\_skeptic.png

│   ├── fig4\_quote\_card\_late.png

│   └── fig4\_quote\_card\_consumer.png

│

├── notebooks/

│   └── exploration.ipynb

│

├── deliverables/

│   ├── slides\_final.pptx

│   ├── voiceover\_script.md

│   ├── video\_final.mp4

│   └── methods\_appendix.md

│

└── docs/

&#x20;   ├── analysis\_log.md

&#x20;   └── quote\_shortlist.md

```



\### Build instructions for Claude Code



\#### Step 1: `analysis/00\_load\_and\_clean.py`



Load the CSV. Validate row count is \~930. Document column types. Drop or impute as documented in `docs/analysis\_log.md`. Output `data/processed/analysis\_ready.parquet`.



```python

"""

Load Giving Tuesday 2024 survey data, validate, clean, and save processed version.



Inputs:  data/raw/giving\_tuesday\_2024.csv

Outputs: data/processed/analysis\_ready.parquet

&#x20;        docs/analysis\_log.md (append cleaning decisions)



Key cleaning steps:

\- Strip whitespace from string columns

\- Convert ai\_use, ai\_want, ai\_risk lists from string-encoded to actual lists

\- Drop respondents with nonprofit != 1 (we focus on nonprofits)

\- Document NA counts per column

"""

```



\#### Step 2: `analysis/01\_feature\_engineering.py`



Build the composite infrastructure score and the binary AI use outcome.



```python

"""

Feature engineering for the Readiness Paradox analysis.



Outputs (added to processed parquet):

\- infra\_score: sum of 9 normalized binary indicators, scaled 0-1

&#x20;   Components:

&#x20;     tech\_person, merl\_person, cloud\_storage, data\_use\_policy, org\_agreements,

&#x20;     \[D] Our staff manually fill out spreadsheets...

&#x20;     \[D] Our staff uses software to collect data...

&#x20;     \[D] We collect data using devices...

&#x20;     \[D] We have at least a hundred transcripts or records...

\- is\_using\_ai: binary, 1 if NOT '\[U] I am not currently using AI', else 0

\- comfort: person\_ai\_comfort (0-1 normalized, already in dataset)

\- region\_simple: GN/GS binary

\- size\_simple: 0-15 / 16-30 / 31+ buckets

\- cause\_top5: dummy for top 5 most common org\_label categories



Document component selection rationale in docs/analysis\_log.md.

"""

```



\#### Step 3: `analysis/02\_descriptives.py`



Generate `figures/fig1\_dual\_scatter.png`.



```python

"""

Headline visualization: dual scatter, infrastructure vs use, comfort vs use.



Both panels:

&#x20; - x-axis: predictor (0-1 scale)

&#x20; - y-axis: % using AI (binned, 5-7 bins on x with 95% CI bars)

&#x20; - R² annotated in upper right of each panel

&#x20; - Sample size in caption

&#x20; - Same y-axis scale across both panels for fair visual comparison

&#x20; - Color: infrastructure = muted gray-blue, comfort = warm orange

&#x20; - Subtle title: 'Two predictors, two stories'



Style:

&#x20; - Sans-serif font (Helvetica, Arial, or Inter)

&#x20; - White background

&#x20; - Minimal gridlines

&#x20; - Export at 300 DPI, 16:9 aspect ratio

&#x20; - Save as figures/fig1\_dual\_scatter.png

"""

```



\#### Step 4: `analysis/03\_main\_regression.py`



Logistic regression with controls. Generate `figures/fig2\_coef\_bar.png`.



```python

"""

Logistic regression: is\_using\_ai \~ comfort + infra components + controls



Specification:

&#x20; is\_using\_ai \~ comfort 

&#x20;             + tech\_person + merl\_person + cloud\_storage + data\_use\_policy 

&#x20;             + org\_agreements 

&#x20;             + C(region\_simple) + C(size\_simple) + C(cause\_top5)



Output:

&#x20; - Standardized coefficients (z-score predictors before fitting)

&#x20; - Horizontal bar chart of standardized coefficients

&#x20; - Coefficients sorted by magnitude

&#x20; - Comfort highlighted in warm orange, others in gray-blue

&#x20; - 95% CI as error bars

&#x20; - Caption: 'Logistic regression with controls. n=XXX. \*=p<0.05, \*\*=p<0.01.'



Save as figures/fig2\_coef\_bar.png. Print regression table to console

and save to docs/regression\_table.txt.



DECISION GATE: If comfort coefficient is not in top 2 by magnitude, flag

as a methodology note in the script and ALERT the user. This is the

core finding; if it doesn't hold, pivot to Track 1 alternative.

"""

```



\#### Step 5: `analysis/04\_stratification.py`



Same finding within subgroups. Generate `figures/fig3\_stratification.png`.



```python

"""

Robustness check: replicate main finding within subgroups.



Subgroups to check:

&#x20; - Global South only (region\_simple == 'GS')

&#x20; - Small orgs only (size\_simple == '0-15')

&#x20; - Top 3 cause areas: Education, Health \& Wellness, Social Services



For each subgroup:

&#x20; - Re-run main regression

&#x20; - Extract standardized comfort coefficient

&#x20; - Plot as a forest plot: subgroup name on y-axis, coefficient with 95% CI on x



Output figures/fig3\_stratification.png as a single forest plot.

Save subgroup regression tables to docs/stratification\_tables.txt.

"""

```



\#### Step 6: `analysis/05\_quote\_selection.py`



```python

"""

Filter ai\_opentext for substantive responses, sample by cluster, prepare for hand-vetting.



Steps:

&#x20; - Filter: response length > 30 characters and not equal to common boilerplate

&#x20; - Group by cluster3 (3-cluster k-means: AI Consumers, Late Adopters, AI Skeptics)

&#x20; - Sample 50 per cluster (or all if fewer)

&#x20; - Output to docs/quote\_shortlist.md as a markdown file with:

&#x20;     ## Cluster: AI Skeptics

&#x20;     ### Quote 1

&#x20;     \[text]

&#x20;     Cluster: -1, comfort score: X.XX, org: \[org\_label]

&#x20;     

The user will hand-pick 1 per cluster. Update docs/quote\_shortlist.md with

selections marked \*\*SELECTED\*\*.



After selection, generate quote cards as PNGs:

&#x20; figures/fig4\_quote\_card\_skeptic.png

&#x20; figures/fig4\_quote\_card\_late.png

&#x20; figures/fig4\_quote\_card\_consumer.png



Each quote card: clean white background, large readable serif font for quote,

small caption with cluster label and one demographic detail, export at 300 DPI 16:9.

"""

```



\#### Step 7: `analysis/run\_all.py`



Orchestrator that runs steps 1-5 in sequence and reports timing.



\#### Step 8: `deliverables/voiceover\_script.md`



```markdown

\# Voiceover Script



Target runtime: 2:00-2:20



\## \[0:00-0:12] Hook

Funders have spent years investing in nonprofit data infrastructure to enable

AI adoption. Cloud storage. Data policies. Tech staff. We looked at 930

nonprofits to ask whether it's actually working. The answer surprised us.



\## \[0:12-0:35] Setup

The Giving Tuesday survey asked nonprofits everything: what tech they have,

how comfortable they are with AI, and whether they're actually using it. We

built a composite infrastructure score from nine indicators. Then we plotted

it against actual AI adoption.



\## \[0:35-0:55] Reveal

Infrastructure barely predicts adoption. The R² is small. But personal

comfort with AI predicts it strongly. Same dataset. Same adoption measure.

Wildly different relationship.



\## \[0:55-1:15] Methods

We ran a logistic regression controlling for region, organization size, and

cause area. Comfort dominates every infrastructure variable in the model.

And the pattern holds across the Global South, small organizations, and

the most common cause areas in the sample.



\## \[1:15-1:50] Voices

We read the open-ended responses. A skeptic told us their board is afraid.

A late adopter said they have the tools but not the training. A consumer

said it started with one person trying ChatGPT for marketing emails.



\## \[1:50-2:10] Synthesis + ask

Infrastructure is necessary. Comfort is what's binding. If funders want to

move the needle on AI adoption in nonprofits, the leverage point isn't the

platform. It's the human who's afraid to use it. Fund people, not platforms.



\## \[2:10-2:20] Close

Methodology and full analysis in the appendix. Thanks.

```



\#### Step 9: Slide deck



Tell Claude Code to NOT auto-generate the pptx; you'll assemble it manually using the figures it produces, since slide design is hard to automate well. Use Google Slides or Keynote with these slides:



```

1\.  Title

2\.  Hook ("What predicts AI adoption?")

3\.  Setup (conventional thesis)

4\.  fig1\_dual\_scatter.png as full-bleed

5\.  fig2\_coef\_bar.png as full-bleed

6\.  fig3\_stratification.png as full-bleed

7\.  fig4\_quote\_card\_skeptic.png

8\.  fig4\_quote\_card\_late.png

9\.  fig4\_quote\_card\_consumer.png

10\. Synthesis ("Infrastructure is necessary. Comfort is binding.")

11\. Implication ("Fund people, not platforms.")

12\. Methods + caveats

```



\---



\# TRACK 2 SPEC



\## Project: PhilanthroGlobe



\### Mission



Build an interactive Cesium-based dashboard showing global philanthropy flows from the OECD dataset, with two analytical lenses: Crisis Response (time animation) and Marker Credibility (donor accountability via OECD policy markers).



\### Hard constraints



\- OECD data must remain primary (no external substantive data)

\- Functional dashboard with public URL

\- Submission deadline: Monday April 27, 11:59pm



\### Tech stack



\- \*\*Build tool:\*\* Vite

\- \*\*Framework:\*\* React 18 + TypeScript

\- \*\*Styling:\*\* Tailwind CSS

\- \*\*Globe:\*\* Cesium via Resium (React wrapper)

\- \*\*State:\*\* Zustand

\- \*\*Charts:\*\* Recharts

\- \*\*Data prep:\*\* Python + pandas

\- \*\*Hosting:\*\* Vercel

\- \*\*Version control:\*\* GitHub



\### Deliverables



1\. Pre-aggregated JSON data files in `public/data/`

2\. Deployed Vercel URL

3\. GitHub repo (public or shared with judges)

4\. Demo recording (`deliverables/demo.mp4`)



\### Repository structure (final state)



```

philanthroglobe/

├── SPEC.md

├── DATA\_DICTIONARY.md

├── README.md

├── package.json

├── tsconfig.json

├── vite.config.ts

├── tailwind.config.js

├── postcss.config.js

├── index.html

├── vercel.json

├── .env.example

├── .gitignore

│

├── public/

│   ├── data/

│   │   ├── flows\_by\_year.json

│   │   ├── donor\_summary.json

│   │   ├── country\_summary.json

│   │   ├── marker\_breakdown.json

│   │   ├── countries\_geo.json

│   │   └── crisis\_events.json

│   └── favicon.ico

│

├── scripts/

│   ├── build\_data.py

│   ├── geocode\_countries.py

│   ├── validate\_data.py

│   └── requirements.txt

│

├── data/

│   └── raw/

│       └── oecd\_philanthropy.csv

│

├── src/

│   ├── App.tsx

│   ├── main.tsx

│   ├── styles/

│   │   └── globals.css

│   │

│   ├── components/

│   │   ├── Globe/

│   │   │   ├── CesiumGlobe.tsx

│   │   │   ├── ArcLayer.tsx

│   │   │   ├── DonorPins.tsx

│   │   │   └── CrisisAnnotations.tsx

│   │   ├── Controls/

│   │   │   ├── ModeToggle.tsx

│   │   │   ├── YearSlider.tsx

│   │   │   ├── PlayButton.tsx

│   │   │   ├── SectorFilter.tsx

│   │   │   └── MarkerSelector.tsx

│   │   ├── Drilldown/

│   │   │   ├── DonorPanel.tsx

│   │   │   ├── CountryPanel.tsx

│   │   │   └── MarkerCredibilityCard.tsx

│   │   └── Layout/

│   │       ├── Sidebar.tsx

│   │       ├── Header.tsx

│   │       └── MethodologyFooter.tsx

│   │

│   ├── lib/

│   │   ├── dataLoader.ts

│   │   ├── filters.ts

│   │   ├── colorScales.ts

│   │   └── arcGeometry.ts

│   │

│   ├── state/

│   │   └── store.ts

│   │

│   └── types/

│       └── index.ts

│

├── deliverables/

│   └── demo.mp4

│

└── .github/

&#x20;   └── workflows/

&#x20;       └── deploy.yml

```



\### Data Schemas



These are the contracts between the Python pipeline and the React frontend. Lock these first.



\#### `countries\_geo.json`



```json

\[

&#x20; {

&#x20;   "iso3": "UKR",

&#x20;   "name": "Ukraine",

&#x20;   "lat": 49.0,

&#x20;   "lon": 32.0,

&#x20;   "continent": "Europe"

&#x20; }

]

```



\#### `flows\_by\_year.json`



```json

{

&#x20; "years": \[2018, 2019, 2020, 2021, 2022, 2023, 2024],

&#x20; "flows": \[

&#x20;   {

&#x20;     "year": 2022,

&#x20;     "donor\_id": "lund\_trust",

&#x20;     "donor\_name": "Lund Trust",

&#x20;     "donor\_country": "GBR",

&#x20;     "recipient\_iso3": "UKR",

&#x20;     "recipient\_name": "Ukraine",

&#x20;     "usd\_disbursed\_m": 11.21,

&#x20;     "n\_projects": 3,

&#x20;     "top\_sector": "Emergency Response",

&#x20;     "top\_sector\_code": 720

&#x20;   }

&#x20; ]

}

```



\#### `donor\_summary.json`



```json

\[

&#x20; {

&#x20;   "donor\_id": "lund\_trust",

&#x20;   "donor\_name": "Lund Trust",

&#x20;   "donor\_country": "GBR",

&#x20;   "total\_usd\_m": 145.3,

&#x20;   "n\_projects": 287,

&#x20;   "n\_countries": 42,

&#x20;   "top\_sectors": \[

&#x20;     {"name": "Emergency Response", "usd\_m": 32.1},

&#x20;     {"name": "General Environment Protection", "usd\_m": 24.5}

&#x20;   ],

&#x20;   "top\_recipients": \[

&#x20;     {"iso3": "UKR", "name": "Ukraine", "usd\_m": 12.5},

&#x20;     {"iso3": "AFG", "name": "Afghanistan", "usd\_m": 8.3}

&#x20;   ],

&#x20;   "year\_range": \[2018, 2024]

&#x20; }

]

```



\#### `country\_summary.json`



```json

\[

&#x20; {

&#x20;   "iso3": "UKR",

&#x20;   "name": "Ukraine",

&#x20;   "total\_received\_usd\_m": 245.0,

&#x20;   "n\_donors": 18,

&#x20;   "n\_projects": 89,

&#x20;   "top\_donors": \[

&#x20;     {"donor\_id": "lund\_trust", "donor\_name": "Lund Trust", "usd\_m": 12.5}

&#x20;   ],

&#x20;   "top\_sectors": \[

&#x20;     {"name": "Emergency Response", "usd\_m": 130.2}

&#x20;   ],

&#x20;   "by\_year": {

&#x20;     "2020": 8.1,

&#x20;     "2021": 6.4,

&#x20;     "2022": 145.6,

&#x20;     "2023": 67.3,

&#x20;     "2024": 17.6

&#x20;   }

&#x20; }

]

```



\#### `marker\_breakdown.json`



```json

\[

&#x20; {

&#x20;   "donor\_id": "lund\_trust",

&#x20;   "donor\_name": "Lund Trust",

&#x20;   "markers": {

&#x20;     "gender": {

&#x20;       "screened\_pct": 0.85,

&#x20;       "principal\_pct": 0.18,

&#x20;       "significant\_pct": 0.31,

&#x20;       "not\_targeted\_pct": 0.36,

&#x20;       "credibility\_score": 0.49

&#x20;     },

&#x20;     "climate\_mitigation": {

&#x20;       "screened\_pct": 0.92,

&#x20;       "principal\_pct": 0.41,

&#x20;       "significant\_pct": 0.23,

&#x20;       "not\_targeted\_pct": 0.28,

&#x20;       "credibility\_score": 0.64

&#x20;     },

&#x20;     "biodiversity": {

&#x20;       "screened\_pct": 0.78,

&#x20;       "principal\_pct": 0.22,

&#x20;       "significant\_pct": 0.15,

&#x20;       "not\_targeted\_pct": 0.41,

&#x20;       "credibility\_score": 0.37

&#x20;     }

&#x20;   }

&#x20; }

]

```



`credibility\_score` definition: `(principal\_pct \* 1.0 + significant\_pct \* 0.5)` — a weighted measure of how much a donor's portfolio actually targets the marker.



\#### `crisis\_events.json`



```json

\[

&#x20; {

&#x20;   "id": "ukraine\_2022",

&#x20;   "name": "Russian invasion of Ukraine",

&#x20;   "year": 2022,

&#x20;   "country\_iso3": "UKR",

&#x20;   "lat": 49.0,

&#x20;   "lon": 32.0,

&#x20;   "description": "Full-scale invasion triggered the largest humanitarian funding response in recent OECD philanthropy data.",

&#x20;   "highlight\_color": "#ff6b35"

&#x20; },

&#x20; {

&#x20;   "id": "covid\_2020",

&#x20;   "name": "COVID-19 global pandemic",

&#x20;   "year": 2020,

&#x20;   "country\_iso3": null,

&#x20;   "lat": null,

&#x20;   "lon": null,

&#x20;   "description": "Global health emergency triggered cross-sector philanthropic response.",

&#x20;   "highlight\_color": "#3a86ff"

&#x20; }

]

```



\### Build instructions for Claude Code



\#### Step 1: `scripts/build\_data.py`



```python

"""

Preprocess OECD philanthropy CSV into pre-aggregated JSON files for the dashboard.



Inputs:  data/raw/oecd\_philanthropy.csv

&#x20;        scripts/country\_centroids.csv  (lookup table, generated separately)

Outputs: public/data/flows\_by\_year.json

&#x20;        public/data/donor\_summary.json

&#x20;        public/data/country\_summary.json

&#x20;        public/data/marker\_breakdown.json

&#x20;        public/data/countries\_geo.json



Key transformations:

&#x20; 1. Standardize donor names (strip, normalize case, generate stable donor\_id slug)

&#x20; 2. Map country names to ISO3 codes; drop rows with unmappable recipients

&#x20; 3. Handle NDA-aggregated rows where year='2020-2023': exclude from

&#x20;    time-series outputs but include in donor totals (note in donor record)

&#x20; 4. Cap to top 50 donors by total disbursement for visualization (long tail

&#x20;    hidden but counted in 'other' aggregate)

&#x20; 5. For flows\_by\_year: aggregate by (year, donor\_id, recipient\_iso3) summing

&#x20;    usd\_disbursements\_defl. Filter to flows >= $0.1M to keep JSON small.

&#x20; 6. For marker\_breakdown: compute screened\_pct, principal\_pct (score=2),

&#x20;    significant\_pct (score=1), not\_targeted\_pct (score=0), credibility\_score.

&#x20;    NULL handled as 'not screened' in screening\_pct calculation.

&#x20; 7. Top sectors: collapse subsector codes into \~8 user-friendly groups

&#x20;    (Health, Education, Climate, Emergency, Environment, Economic Dev, Gov, Other)

&#x20; 8. Output validation: ensure all donor\_ids in flows match donor\_summary,

&#x20;    all recipient\_iso3 match countries\_geo. Fail loudly on mismatch.



Print summary stats at end:

&#x20; - Total rows in raw vs processed

&#x20; - Number of donors, countries, years

&#x20; - Total USD disbursed

&#x20; - Rows excluded due to NDA aggregation

&#x20; - Rows excluded due to country mapping failure

&#x20; - Output file sizes

"""

```



\#### Step 2: `scripts/geocode\_countries.py`



```python

"""

Generate country\_centroids.csv with ISO3 + lat/lon for all DAC recipient countries.



Use a static lookup. Source: pycountry library or hardcoded JSON of \~250 countries

with centroids (Natural Earth or similar public reference data).



DO NOT call external geocoding APIs. This is one-time reference data.



Output: scripts/country\_centroids.csv with columns: iso3, name, lat, lon, continent

"""

```



\#### Step 3: `scripts/validate\_data.py`



```python

"""

Sanity-check all output JSONs before deploy.



Checks:

&#x20; - All files load as valid JSON

&#x20; - All donor\_ids consistent across files

&#x20; - All iso3 codes consistent across files

&#x20; - File sizes reasonable (<5MB each)

&#x20; - No NaN or null values where not expected

&#x20; - Years field in flows\_by\_year matches actual data

&#x20; - Marker percentages sum to \~1.0 per donor



Print report. Exit with non-zero if any check fails.

"""

```



\#### Step 4: `package.json`



```json

{

&#x20; "name": "philanthroglobe",

&#x20; "private": true,

&#x20; "version": "0.1.0",

&#x20; "type": "module",

&#x20; "scripts": {

&#x20;   "dev": "vite",

&#x20;   "build": "tsc \&\& vite build",

&#x20;   "preview": "vite preview"

&#x20; },

&#x20; "dependencies": {

&#x20;   "react": "^18.3.1",

&#x20;   "react-dom": "^18.3.1",

&#x20;   "resium": "^1.18.1",

&#x20;   "cesium": "^1.118.0",

&#x20;   "zustand": "^4.5.2",

&#x20;   "recharts": "^2.12.7",

&#x20;   "lucide-react": "^0.383.0"

&#x20; },

&#x20; "devDependencies": {

&#x20;   "@types/react": "^18.3.3",

&#x20;   "@types/react-dom": "^18.3.0",

&#x20;   "@vitejs/plugin-react": "^4.3.1",

&#x20;   "autoprefixer": "^10.4.19",

&#x20;   "postcss": "^8.4.39",

&#x20;   "tailwindcss": "^3.4.4",

&#x20;   "typescript": "^5.4.5",

&#x20;   "vite": "^5.3.1",

&#x20;   "vite-plugin-cesium": "^1.2.22"

&#x20; }

}

```



\#### Step 5: `vite.config.ts`



```typescript

import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

import cesium from 'vite-plugin-cesium'



export default defineConfig({

&#x20; plugins: \[react(), cesium()],

&#x20; server: { port: 5173 }

})

```



\#### Step 6: `src/types/index.ts`



```typescript

export type Mode = 'crisis' | 'credibility'

export type Marker = 'gender' | 'climate\_mitigation' | 'biodiversity'



export interface Country {

&#x20; iso3: string

&#x20; name: string

&#x20; lat: number

&#x20; lon: number

&#x20; continent: string

}



export interface Flow {

&#x20; year: number

&#x20; donor\_id: string

&#x20; donor\_name: string

&#x20; donor\_country: string

&#x20; recipient\_iso3: string

&#x20; recipient\_name: string

&#x20; usd\_disbursed\_m: number

&#x20; n\_projects: number

&#x20; top\_sector: string

&#x20; top\_sector\_code: number

}



export interface DonorSummary {

&#x20; donor\_id: string

&#x20; donor\_name: string

&#x20; donor\_country: string

&#x20; total\_usd\_m: number

&#x20; n\_projects: number

&#x20; n\_countries: number

&#x20; top\_sectors: Array<{ name: string; usd\_m: number }>

&#x20; top\_recipients: Array<{ iso3: string; name: string; usd\_m: number }>

&#x20; year\_range: \[number, number]

}



export interface MarkerStats {

&#x20; screened\_pct: number

&#x20; principal\_pct: number

&#x20; significant\_pct: number

&#x20; not\_targeted\_pct: number

&#x20; credibility\_score: number

}



export interface MarkerBreakdown {

&#x20; donor\_id: string

&#x20; donor\_name: string

&#x20; markers: Record<Marker, MarkerStats>

}



export interface CrisisEvent {

&#x20; id: string

&#x20; name: string

&#x20; year: number

&#x20; country\_iso3: string | null

&#x20; lat: number | null

&#x20; lon: number | null

&#x20; description: string

&#x20; highlight\_color: string

}

```



\#### Step 7: `src/state/store.ts`



```typescript

import { create } from 'zustand'

import type { Mode, Marker } from '../types'



interface AppState {

&#x20; // Mode and time

&#x20; mode: Mode

&#x20; setMode: (m: Mode) => void

&#x20; year: number

&#x20; setYear: (y: number) => void

&#x20; isPlaying: boolean

&#x20; setIsPlaying: (p: boolean) => void

&#x20; 

&#x20; // Marker (only used in credibility mode)

&#x20; selectedMarker: Marker

&#x20; setSelectedMarker: (m: Marker) => void

&#x20; 

&#x20; // Filters

&#x20; sectorFilter: string | null

&#x20; setSectorFilter: (s: string | null) => void

&#x20; 

&#x20; // Drill-down

&#x20; selectedDonorId: string | null

&#x20; setSelectedDonorId: (id: string | null) => void

&#x20; selectedCountryIso3: string | null

&#x20; setSelectedCountryIso3: (iso3: string | null) => void

}



export const useStore = create<AppState>((set) => ({

&#x20; mode: 'crisis',

&#x20; setMode: (mode) => set({ mode }),

&#x20; year: 2022,

&#x20; setYear: (year) => set({ year }),

&#x20; isPlaying: false,

&#x20; setIsPlaying: (isPlaying) => set({ isPlaying }),

&#x20; selectedMarker: 'gender',

&#x20; setSelectedMarker: (selectedMarker) => set({ selectedMarker }),

&#x20; sectorFilter: null,

&#x20; setSectorFilter: (sectorFilter) => set({ sectorFilter }),

&#x20; selectedDonorId: null,

&#x20; setSelectedDonorId: (selectedDonorId) => set({ selectedDonorId }),

&#x20; selectedCountryIso3: null,

&#x20; setSelectedCountryIso3: (selectedCountryIso3) => set({ selectedCountryIso3 }),

}))

```



\#### Step 8: Components



For each component, Claude Code should create:

\- TypeScript with strict types

\- Tailwind for styling

\- No inline styles except for Cesium-specific things

\- Clear prop interfaces

\- One responsibility per component



Critical components and their behavior:



\*\*`CesiumGlobe.tsx`\*\*: Resium `<Viewer>` wrapper. Earth-centered camera. Disable timeline and animation widgets (we use our own slider). Listen to clicks on entities; dispatch to store.



\*\*`ArcLayer.tsx`\*\*: Renders flows as Cesium `PolylineGraphics` with bezier curves between donor country and recipient country centroids. Thickness proportional to `usd\_disbursed\_m`. In crisis mode: color by sector. In credibility mode: color arcs originating from donor by their `credibility\_score` for the selected marker.



\*\*`YearSlider.tsx`\*\*: Continuous range slider (2018-2024 or whatever data covers). Scrubbing updates store. Play button toggles auto-advance via `setInterval`, \~1 year per second.



\*\*`ModeToggle.tsx`\*\*: Two buttons, pill-style. Crisis Response | Marker Credibility.



\*\*`MarkerSelector.tsx`\*\*: Dropdown or radio group for gender / climate / biodiversity. Only visible in credibility mode.



\*\*`DonorPanel.tsx`\*\*: Slides in from right when `selectedDonorId` is set. Shows donor name, total USD, top sectors, top recipients (Recharts bar chart), marker breakdown card.



\*\*`CountryPanel.tsx`\*\*: Same pattern, opens when `selectedCountryIso3` is set. Shows top donors funding it, sector breakdown, year-over-year line chart.



\*\*`CrisisAnnotations.tsx`\*\*: Reads `crisis\_events.json`, renders pulsing pins on globe at relevant lat/lon when `year` matches event year. Click to expand description.



\*\*`MethodologyFooter.tsx`\*\*: Always visible at bottom. Three lines:

\- "Source: OECD Private Philanthropy for Development. NDA-aggregated rows excluded from time-series."

\- "Markers: 0=not targeted, 1=significant, 2=principal. NULL=not screened."

\- "Credibility = principal\_pct + 0.5 × significant\_pct. Higher = better alignment."



\#### Step 9: `vercel.json`



```json

{

&#x20; "buildCommand": "npm run build",

&#x20; "outputDirectory": "dist",

&#x20; "framework": "vite"

}

```



\#### Step 10: `.github/workflows/deploy.yml`



Skip this. Vercel's GitHub integration handles auto-deploy on push without needing a workflow file.



\---



\## Build Order (Recommended)



\### Track 2 (build first, it's the bigger lift)



1\. Person A: `scripts/geocode\_countries.py` → produce `country\_centroids.csv` (1 hour)

2\. Person B: `package.json` + `vite.config.ts` + scaffold + Cesium hello-world (1 hour)

3\. Person A: `scripts/build\_data.py` → produce all JSON files (3 hours)

4\. Person B: `CesiumGlobe.tsx` + `ArcLayer.tsx` rendering flows (2 hours)

5\. Person B: `YearSlider.tsx` + `PlayButton.tsx` + animation (1 hour)

6\. Person B: `ModeToggle.tsx` + `MarkerSelector.tsx` (1 hour)

7\. Person B: `DonorPanel.tsx` + `CountryPanel.tsx` (2 hours)

8\. Person B: `CrisisAnnotations.tsx` + polish (1 hour)

9\. Person A: `scripts/validate\_data.py` + Track 1 work begins

10\. Both: Vercel deploy + demo recording (1 hour)



\### Track 1 (build Sunday)



1\. Person A: `00\_load\_and\_clean.py` + `01\_feature\_engineering.py` (2 hours)

2\. Person A: `02\_descriptives.py` → fig1 (1.5 hours)

3\. Person A: `03\_main\_regression.py` → fig2 (2 hours) — \*\*DECISION GATE\*\*

4\. Person A: `04\_stratification.py` → fig3 (1.5 hours)

5\. Person A: `05\_quote\_selection.py` → shortlist (1 hour)

6\. Person A: hand-pick quotes, generate quote cards (1 hour)

7\. Person B: assemble slide deck from figures (2 hours)

8\. Person A: voiceover script polish + record (1.5 hours)

9\. Both: video assembly + final polish (1 hour)



\---



\## Reference Links to Add to Each Repo's README



Track 1:

\- Giving Tuesday AI Readiness Report (whichever URL Samir's team published)

\- statsmodels logistic regression docs

\- Anthropic Claude Code docs



Track 2:

\- Cesium Ion sign-up: https://ion.cesium.com

\- Resium docs: https://resium.reearth.io

\- OECD philanthropy data dictionary (paste in DATA\_DICTIONARY.md)

\- Vercel deploy docs



\---



\## Pre-Flight Checklist



1\. ☐ Create both repo directories

2\. ☐ Add `.gitignore` to each

3\. ☐ Add `requirements.txt` to Track 1

4\. ☐ Add `package.json` skeleton to Track 2

5\. ☐ Add `SPEC.md` (paste relevant section from this doc)

6\. ☐ Add `DATA\_DICTIONARY.md` (paste your earlier data dict messages)

7\. ☐ Sign up for Cesium Ion, get token, add to `.env`

8\. ☐ Confirm both datasets are downloaded to `data/raw/`

9\. ☐ `git init` and initial commit on both

10\. ☐ Push to GitHub

11\. ☐ Connect Vercel to Track 2 repo

12\. ☐ Open Claude Code in each repo, point at `SPEC.md`








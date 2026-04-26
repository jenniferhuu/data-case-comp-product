"""
build_data.py — OECD philanthropy data pipeline.
Reads data/raw/oecd_philanthropy.csv and writes 6 JSON files to public/data/.
"""
import sys
import os
import re
import json

import pandas as pd
import numpy as np

# Make sure the scripts/ directory is on the path so we can import geocode_countries
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

from geocode_countries import name_to_iso3, NAME_OVERRIDES, CENTROIDS

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.dirname(SCRIPTS_DIR)
CSV_PATH = os.path.join(PROJECT_ROOT, "data", "raw", "oecd_philanthropy.csv")
CENTROIDS_CSV = os.path.join(SCRIPTS_DIR, "country_centroids.csv")
OUT_DIR = os.path.join(PROJECT_ROOT, "public", "data")

SECTOR_MAP = {
    720: "Emergency", 730: "Emergency", 740: "Emergency", 930: "Emergency",
    110: "Education", 111: "Education", 112: "Education", 113: "Education", 114: "Education",
    120: "Health", 121: "Health", 122: "Health", 123: "Health", 130: "Health",
    410: "Environment", 411: "Environment", 412: "Environment", 430: "Environment", 440: "Environment",
    230: "Climate", 231: "Climate", 232: "Climate",
    150: "Gov & Civil Society", 151: "Gov & Civil Society", 152: "Gov & Civil Society",
    153: "Gov & Civil Society",
    200: "Economic Dev", 210: "Economic Dev", 211: "Economic Dev", 220: "Economic Dev",
    240: "Economic Dev", 250: "Economic Dev", 260: "Economic Dev",
    310: "Economic Dev", 311: "Economic Dev", 312: "Economic Dev", 321: "Economic Dev",
    331: "Economic Dev",
}

MARKER_COLS = {
    "gender": "gender_marker",
    "climate_mitigation": "climate_change_mitigation",
    "climate_adaptation": "climate_change_adaptation",
    "environment": "environment",
    "biodiversity": "biodiversity",
    "desertification": "desertification",
    "nutrition": "nutrition",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def load_centroids() -> dict:
    """Return iso3 -> {lat, lon, continent, name} from country_centroids.csv."""
    df = pd.read_csv(CENTROIDS_CSV)
    result = {}
    for _, row in df.iterrows():
        result[row["iso3"]] = {
            "lat": float(row["lat"]),
            "lon": float(row["lon"]),
            "continent": row["continent"],
            "name": row["name"],
        }
    return result


def resolve_iso3(name: str, centroid_lookup: dict) -> str | None:
    """Resolve country name to ISO3 code."""
    if not name or not isinstance(name, str):
        return None
    # Check NAME_OVERRIDES first
    if name in NAME_OVERRIDES:
        return NAME_OVERRIDES[name]
    # Check centroid lookup by name
    for iso3, info in centroid_lookup.items():
        if info["name"].lower() == name.lower():
            return iso3
    # Fallback to pycountry fuzzy search
    return name_to_iso3(name)


def sector_group(sector_val) -> str:
    try:
        s = int(float(sector_val))
        return SECTOR_MAP.get(s, "Other")
    except (ValueError, TypeError):
        return "Other"


def compute_marker_stats(group: pd.DataFrame, col: str) -> dict:
    """Compute marker statistics for a column within a group."""
    total = len(group)
    screened_mask = group[col].notna()
    screened = int(screened_mask.sum())
    if screened == 0:
        return {
            "total": total,
            "screened": 0,
            "screened_pct": 0.0,
            "principal_pct": 0.0,
            "significant_pct": 0.0,
            "not_targeted_pct": 0.0,
            "credibility_score": 0.0,
        }
    vals = group.loc[screened_mask, col]
    principal_pct = float((vals == 2).sum()) / screened
    significant_pct = float((vals == 1).sum()) / screened
    not_targeted_pct = float((vals == 0).sum()) / screened
    screened_pct = screened / total
    credibility_score = principal_pct + 0.5 * significant_pct
    return {
        "total": total,
        "screened": screened,
        "screened_pct": round(screened_pct, 4),
        "principal_pct": round(principal_pct, 4),
        "significant_pct": round(significant_pct, 4),
        "not_targeted_pct": round(not_targeted_pct, 4),
        "credibility_score": round(credibility_score, 4),
    }


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # Load CSV
    df = pd.read_csv(CSV_PATH, low_memory=False)
    raw_rows = len(df)

    # Normalise year column to string for comparisons
    df["year_str"] = df["year"].astype(str).str.strip()

    # Separate NDA aggregated rows (year == "2020-2023")
    nda_mask = df["year_str"] == "2020-2023"
    nda_rows = int(nda_mask.sum())
    df_ts = df[~nda_mask].copy()  # time-series rows only
    df_all = df.copy()            # all rows (incl. NDA) for donor totals

    # Convert year to int for time-series
    df_ts["year_int"] = pd.to_numeric(df_ts["year_str"], errors="coerce").astype("Int64")

    # Load centroids
    centroid_lookup = load_centroids()

    # Add CENTROIDS entries that may not be in the CSV (donor countries)
    for iso3, (lat, lon, continent) in CENTROIDS.items():
        if iso3 not in centroid_lookup:
            centroid_lookup[iso3] = {"lat": lat, "lon": lon, "continent": continent, "name": iso3}

    # Resolve recipient ISO3s
    recipient_names = df_ts["country"].dropna().unique().tolist()
    unmapped_recipients = []
    recip_iso3_map: dict[str, str] = {}
    for name in recipient_names:
        iso3 = resolve_iso3(name, centroid_lookup)
        if iso3:
            recip_iso3_map[name] = iso3
        else:
            unmapped_recipients.append(name)

    df_ts["recipient_iso3"] = df_ts["country"].map(recip_iso3_map)

    # Resolve donor ISO3s (using Donor_country column)
    donor_names_series = df_ts["Donor_country"].dropna().unique().tolist()
    donor_iso3_map: dict[str, str] = {}
    unmapped_donors = []
    for name in donor_names_series:
        iso3 = resolve_iso3(name, centroid_lookup)
        if iso3:
            donor_iso3_map[name] = iso3
        else:
            unmapped_donors.append(name)
            donor_iso3_map[name] = "ZZZ"  # fallback

    df_ts["donor_iso3"] = df_ts["Donor_country"].map(donor_iso3_map)

    # Sector group
    df_ts["sector_group"] = df_ts["Sector"].apply(sector_group)

    # Disbursement amount as float
    df_ts["usd"] = pd.to_numeric(df_ts["usd_disbursements_defl"], errors="coerce").fillna(0.0)

    # -----------------------------------------------------------------------
    # Growth rate: per recipient iso3, total receipts 2020 -> 2023
    # -----------------------------------------------------------------------
    yr2020 = (
        df_ts[df_ts["year_int"] == 2020]
        .groupby("recipient_iso3")["usd"].sum()
        .to_dict()
    )
    yr2023 = (
        df_ts[df_ts["year_int"] == 2023]
        .groupby("recipient_iso3")["usd"].sum()
        .to_dict()
    )
    growth_by_iso3: dict[str, float | None] = {}
    all_iso3s = set(yr2020.keys()) | set(yr2023.keys())
    for iso3 in all_iso3s:
        v2020 = yr2020.get(iso3, 0.0)
        v2023 = yr2023.get(iso3, 0.0)
        if v2020 and v2020 > 0 and v2023:
            growth_by_iso3[iso3] = round((v2023 - v2020) / v2020, 4)
        else:
            growth_by_iso3[iso3] = None

    # -----------------------------------------------------------------------
    # flows_by_year.json
    # -----------------------------------------------------------------------
    # Aggregate at (year, donor_id/name/country, recipient_iso3) grain
    # donor_id comes from organization_name
    grp_cols = ["year_int", "organization_name", "Donor_country", "donor_iso3",
                "recipient_iso3", "country", "sector_group"]

    agg = (
        df_ts[df_ts["recipient_iso3"].notna()]
        .groupby(["year_int", "organization_name", "Donor_country", "donor_iso3",
                  "recipient_iso3", "country"])
        .apply(
            lambda g: pd.Series({
                "usd_disbursed_m": g["usd"].sum(),
                "top_sector": g.groupby("sector_group")["usd"].sum().idxmax()
                    if g["usd"].sum() > 0 else "Other",
            })
        )
        .reset_index()
    )

    # Filter flows >= 0.01M
    agg = agg[agg["usd_disbursed_m"] >= 0.01].copy()

    # Attach growth rate
    agg["growth_rate"] = agg["recipient_iso3"].map(growth_by_iso3)

    # Recipient name from centroid lookup or original country name
    def get_recip_name(row):
        info = centroid_lookup.get(row["recipient_iso3"])
        return info["name"] if info else row["country"]

    agg["recipient_name"] = agg.apply(get_recip_name, axis=1)
    agg["donor_id"] = agg["organization_name"].apply(make_slug)
    # Convert year to plain int
    agg["year"] = agg["year_int"].astype(int)

    flows = []
    for _, row in agg.iterrows():
        gr = row["growth_rate"]
        flows.append({
            "year": int(row["year"]),
            "donor_id": row["donor_id"],
            "donor_name": row["organization_name"],
            "donor_country": row["Donor_country"],
            "recipient_iso3": row["recipient_iso3"],
            "recipient_name": row["recipient_name"],
            "usd_disbursed_m": round(float(row["usd_disbursed_m"]), 4),
            "top_sector": row["top_sector"],
            "growth_rate": float(gr) if gr is not None and not (isinstance(gr, float) and np.isnan(gr)) else None,
        })

    years_list = sorted(agg["year"].unique().tolist())

    with open(os.path.join(OUT_DIR, "flows_by_year.json"), "w", encoding="utf-8") as f:
        json.dump({"years": years_list, "flows": flows}, f, separators=(",", ":"))
    print(f"flows_by_year.json: {len(flows)} flows")

    # -----------------------------------------------------------------------
    # donor_summary.json  (use df_all for totals to include NDA rows)
    # -----------------------------------------------------------------------
    df_all_usd = pd.to_numeric(df_all["usd_disbursements_defl"], errors="coerce").fillna(0.0)
    df_all = df_all.copy()
    df_all["usd"] = df_all_usd
    df_all["donor_iso3_col"] = df_all["Donor_country"].map(donor_iso3_map).fillna("ZZZ")

    donor_totals = (
        df_all.groupby(["organization_name", "Donor_country", "donor_iso3_col"])["usd"]
        .sum()
        .reset_index()
        .rename(columns={"usd": "total_usd_m"})
        .sort_values("total_usd_m", ascending=False)
        .reset_index(drop=True)
    )
    donor_totals["rank"] = donor_totals.index + 1
    donor_totals["donor_id"] = donor_totals["organization_name"].apply(make_slug)

    # Top sector per donor (from time-series)
    donor_sector = (
        df_ts[df_ts["organization_name"].notna()]
        .groupby(["organization_name", "sector_group"])["usd"]
        .sum()
        .reset_index()
    )
    donor_top_sector = {}
    for org, grp in donor_sector.groupby("organization_name"):
        if grp["usd"].sum() > 0:
            donor_top_sector[org] = grp.loc[grp["usd"].idxmax(), "sector_group"]
        else:
            donor_top_sector[org] = "Other"

    # Country count per donor
    donor_country_count = (
        df_ts[df_ts["recipient_iso3"].notna()]
        .groupby("organization_name")["recipient_iso3"]
        .nunique()
        .to_dict()
    )

    donor_summary = []
    for _, row in donor_totals.iterrows():
        org = row["organization_name"]
        donor_summary.append({
            "rank": int(row["rank"]),
            "donor_id": row["donor_id"],
            "donor_name": org,
            "donor_country": row["Donor_country"],
            "donor_iso3": row["donor_iso3_col"],
            "total_usd_m": round(float(row["total_usd_m"]), 4),
            "top_sector": donor_top_sector.get(org, "Other"),
            "countries_count": int(donor_country_count.get(org, 0)),
        })

    with open(os.path.join(OUT_DIR, "donor_summary.json"), "w", encoding="utf-8") as f:
        json.dump(donor_summary, f, separators=(",", ":"))
    print(f"donor_summary.json: {len(donor_summary)} donors")

    # -----------------------------------------------------------------------
    # country_summary.json  (recipient countries)
    # -----------------------------------------------------------------------
    recip_totals = (
        df_ts[df_ts["recipient_iso3"].notna()]
        .groupby(["recipient_iso3", "country"])
        .agg(
            total_usd_m=("usd", "sum"),
            donor_count=("organization_name", "nunique"),
        )
        .reset_index()
    )

    # Top sector per recipient
    recip_sector = (
        df_ts[df_ts["recipient_iso3"].notna()]
        .groupby(["recipient_iso3", "sector_group"])["usd"]
        .sum()
        .reset_index()
    )
    recip_top_sector = {}
    for iso3, grp in recip_sector.groupby("recipient_iso3"):
        if grp["usd"].sum() > 0:
            recip_top_sector[iso3] = grp.loc[grp["usd"].idxmax(), "sector_group"]
        else:
            recip_top_sector[iso3] = "Other"

    # By-year totals per recipient
    by_year_by_country = (
        df_ts[df_ts["recipient_iso3"].notna()]
        .groupby(["recipient_iso3", "year_int"])["usd"]
        .sum()
        .reset_index()
    )

    country_summary = []
    for _, row in recip_totals.iterrows():
        iso3 = row["recipient_iso3"]
        info = centroid_lookup.get(iso3, {})
        gr = growth_by_iso3.get(iso3)
        # Build by_year dict
        byyear = by_year_by_country[by_year_by_country["recipient_iso3"] == iso3]
        by_year_dict = {
            str(int(r["year_int"])): round(float(r["usd"]), 4)
            for _, r in byyear.iterrows()
        }
        country_summary.append({
            "iso3": iso3,
            "name": info.get("name", row["country"]),
            "lat": info.get("lat"),
            "lon": info.get("lon"),
            "continent": info.get("continent"),
            "total_usd_m": round(float(row["total_usd_m"]), 4),
            "donor_count": int(row["donor_count"]),
            "top_sector": recip_top_sector.get(iso3, "Other"),
            "growth_rate": float(gr) if gr is not None and not (isinstance(gr, float) and np.isnan(gr)) else None,
            "by_year": by_year_dict,
        })

    with open(os.path.join(OUT_DIR, "country_summary.json"), "w", encoding="utf-8") as f:
        json.dump(country_summary, f, separators=(",", ":"))
    print(f"country_summary.json: {len(country_summary)} countries")

    # -----------------------------------------------------------------------
    # marker_breakdown.json
    # -----------------------------------------------------------------------
    # Marker columns need numeric conversion
    for col in MARKER_COLS.values():
        df_ts[col] = pd.to_numeric(df_ts[col], errors="coerce")

    marker_breakdown = []
    for org, grp in df_ts.groupby("organization_name"):
        markers = {}
        for marker_key, col in MARKER_COLS.items():
            markers[marker_key] = compute_marker_stats(grp, col)
        marker_breakdown.append({
            "donor_id": make_slug(org),
            "donor_name": org,
            "donor_country": grp["Donor_country"].iloc[0] if len(grp) > 0 else "",
            "total_rows": len(grp),
            "markers": markers,
        })

    with open(os.path.join(OUT_DIR, "marker_breakdown.json"), "w", encoding="utf-8") as f:
        json.dump(marker_breakdown, f, separators=(",", ":"))
    print(f"marker_breakdown.json: {len(marker_breakdown)} donors")

    # -----------------------------------------------------------------------
    # countries_geo.json  (recipients UNION donors)
    # -----------------------------------------------------------------------
    recipient_iso3s = set(df_ts["recipient_iso3"].dropna().unique())
    donor_iso3s = set(donor_iso3_map.values()) - {"ZZZ"}
    all_geo_iso3s = recipient_iso3s | donor_iso3s

    countries_geo = []
    for iso3 in sorted(all_geo_iso3s):
        info = centroid_lookup.get(iso3)
        if info:
            countries_geo.append({
                "iso3": iso3,
                "name": info["name"],
                "lat": info["lat"],
                "lon": info["lon"],
                "continent": info["continent"],
            })
        else:
            # Try CENTROIDS dict directly
            if iso3 in CENTROIDS:
                lat, lon, continent = CENTROIDS[iso3]
                countries_geo.append({
                    "iso3": iso3,
                    "name": iso3,
                    "lat": lat,
                    "lon": lon,
                    "continent": continent,
                })

    with open(os.path.join(OUT_DIR, "countries_geo.json"), "w", encoding="utf-8") as f:
        json.dump(countries_geo, f, separators=(",", ":"))
    print(f"countries_geo.json: {len(countries_geo)} countries")

    # -----------------------------------------------------------------------
    # filter_options.json
    # -----------------------------------------------------------------------
    # Donor countries = full names sorted
    donor_countries_sorted = sorted(
        d["donor_country"] for d in donor_summary
        if d["donor_country"] and isinstance(d["donor_country"], str)
    )
    # Deduplicate while preserving order
    seen = set()
    donor_countries_unique = []
    for dc in donor_countries_sorted:
        if dc not in seen:
            seen.add(dc)
            donor_countries_unique.append(dc)

    sector_groups_present = sorted(df_ts["sector_group"].dropna().unique().tolist())
    years_opts = sorted(df_ts["year_int"].dropna().unique().astype(int).tolist())
    continents_present = sorted(
        set(
            info["continent"]
            for iso3, info in centroid_lookup.items()
            if iso3 in recipient_iso3s and info.get("continent")
        )
    )

    filter_options = {
        "years": years_opts,
        "donor_countries": donor_countries_unique,
        "sectors": sector_groups_present,
        "continents": continents_present,
        "markers": list(MARKER_COLS.keys()),
    }

    with open(os.path.join(OUT_DIR, "filter_options.json"), "w", encoding="utf-8") as f:
        json.dump(filter_options, f, separators=(",", ":"))
    print(f"filter_options.json written")

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    processed = len(df_ts)
    total_usd = df_ts["usd"].sum()
    print()
    print("=== Pipeline complete ===")
    print(f"Raw rows: {raw_rows} -> processed: {processed}")
    print(f"NDA rows excluded: {nda_rows}")
    print(f"Unmapped recipients: {len(unmapped_recipients)}")
    if unmapped_recipients:
        print(f"  {unmapped_recipients[:10]}")
    print(f"Unmapped donors: {len(unmapped_donors)}")
    if unmapped_donors:
        print(f"  {unmapped_donors}")
    print(f"Donors: {len(donor_summary)}  Countries: {len(country_summary)}  Years: {years_opts}")
    print(f"Total USD: ${total_usd:.2f} M")


if __name__ == "__main__":
    main()

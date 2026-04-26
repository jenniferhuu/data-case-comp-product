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
            assert "top_sector" in d

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

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
    assert "years" in data and "flows" in data
    flow = data["flows"][0]
    for field in ["year", "donor_id", "donor_name", "donor_country",
                  "recipient_iso3", "recipient_name", "usd_disbursed_m",
                  "top_sector", "growth_rate"]:
        assert field in flow, f"Missing field: {field}"
    assert len(flow["donor_country"]) > 3, "donor_country must be full name not ISO3"

def test_donor_summary_has_rank_and_iso3(run_pipeline):
    with open("public/data/donor_summary.json") as f:
        donors = json.load(f)
    assert len(donors) > 0
    assert "rank" in donors[0]
    assert "donor_iso3" in donors[0], "donor_summary must have donor_iso3 field"

def test_countries_geo_includes_donor_countries(run_pipeline):
    with open("public/data/countries_geo.json") as f:
        geo = json.load(f)
    iso3s = [c["iso3"] for c in geo]
    assert "GBR" in iso3s, "GBR (United Kingdom donor) must be in countries_geo"

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
    for donor in data[:5]:
        for key, stats in donor["markers"].items():
            expected = round(stats["principal_pct"] + 0.5 * stats["significant_pct"], 4)
            assert abs(expected - round(stats["credibility_score"], 4)) < 0.01

def test_filter_options_donor_countries_are_full_names(run_pipeline):
    with open("public/data/filter_options.json") as f:
        opts = json.load(f)
    for name in opts["donor_countries"]:
        assert len(name) > 3, f"Expected full name, got: {name}"

def test_growth_rate_field_present(run_pipeline):
    with open("public/data/flows_by_year.json") as f:
        data = json.load(f)
    for flow in data["flows"][:50]:
        assert "growth_rate" in flow

def test_sector_groups_are_valid(run_pipeline):
    with open("public/data/filter_options.json") as f:
        opts = json.load(f)
    valid = {"Health", "Education", "Climate", "Emergency", "Environment",
             "Economic Dev", "Gov & Civil Society", "Other"}
    for s in opts["sectors"]:
        assert s in valid, f"Unknown sector group: {s}"

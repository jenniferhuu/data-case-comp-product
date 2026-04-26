import subprocess, csv, os

def test_centroids_file_created():
    result = subprocess.run(
        ["python", "scripts/geocode_countries.py"],
        capture_output=True, text=True, cwd="."
    )
    assert result.returncode == 0, f"Script failed:\n{result.stdout}\n{result.stderr}"
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

def test_centroids_has_over_80_countries():
    with open("scripts/country_centroids.csv") as f:
        rows = list(csv.DictReader(f))
    assert len(rows) >= 80, f"Only {len(rows)} countries found"

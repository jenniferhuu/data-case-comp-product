"""
Generate country_centroids.csv with ISO3 + lat/lon for DAC recipient countries.
Uses a hardcoded centroid dict (no external API). pycountry resolves name->ISO3
for any country not in the hardcoded set.
Output: scripts/country_centroids.csv (iso3, name, lat, lon, continent)
"""
import csv, os
import pycountry

# ISO3 -> (lat, lon, continent)
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
    "MAR": (31.79, -7.09, "Africa"), "BLR": (53.71, 27.95, "Europe"),
    "XKX": (42.60, 20.90, "Europe"), "SRB": (44.02, 21.01, "Europe"),
    "MNE": (42.71, 19.37, "Europe"), "HRV": (45.10, 15.20, "Europe"),
    "BWA": (-22.33, 24.68, "Africa"), "SWZ": (-26.52, 31.47, "Africa"),
    "ZAF": (-30.56, 22.94, "Africa"), "GNQ": (1.65, 10.27, "Africa"),
    "GAB": (-0.80, 11.61, "Africa"), "RUS": (61.52, 105.32, "Europe"),
    "CHN": (35.86, 104.20, "Asia"), "MEX": (23.63, -102.55, "Americas"),
    "ARG": (-38.42, -63.62, "Americas"), "CHL": (-35.68, -71.54, "Americas"),
    "URY": (-32.52, -55.77, "Americas"), "PRY": (-23.44, -58.44, "Americas"),
    "THA": (15.87, 100.99, "Asia"), "KOR": (35.91, 127.77, "Asia"),
    "MUS": (-20.35, 57.55, "Africa"),
    # Donor countries (must be in geo for arc start coords)
    "GBR": (55.38, -3.44, "Europe"), "USA": (37.09, -95.71, "Americas"),
    "FRA": (46.23, 2.21, "Europe"), "DEU": (51.17, 10.45, "Europe"),
    "NLD": (52.13, 5.29, "Europe"), "CHE": (46.82, 8.23, "Europe"),
    "SWE": (60.13, 18.64, "Europe"), "NOR": (60.47, 8.47, "Europe"),
    "DNK": (56.26, 9.50, "Europe"), "AUS": (-25.27, 133.78, "Oceania"),
    "CAN": (56.13, -106.35, "Americas"), "JPN": (36.20, 138.25, "Asia"),
    "ITA": (41.87, 12.57, "Europe"), "ESP": (40.46, -3.75, "Europe"),
    "BEL": (50.50, 4.47, "Europe"), "AUT": (47.52, 14.55, "Europe"),
    "FIN": (61.92, 25.75, "Europe"), "IRL": (53.41, -8.24, "Europe"),
    "LUX": (49.82, 6.13, "Europe"), "NZL": (-40.90, 174.89, "Oceania"),
    "PRT": (39.40, -8.22, "Europe"), "SGP": (1.35, 103.82, "Asia"),
    "HKG": (22.40, 114.11, "Asia"), "ISR": (31.05, 34.85, "Asia"),
    "ARE": (23.42, 53.85, "Asia"), "KWT": (29.31, 47.48, "Asia"),
    "QAT": (25.35, 51.18, "Asia"), "SAU": (23.89, 45.08, "Asia"),
    "ZZZ": (0.0, 0.0, "Other"),  # fallback
}

NAME_OVERRIDES = {
    "West Bank and Gaza Strip": "PSE", "Palestinian Territory": "PSE",
    "Gaza Strip": "PSE", "West Bank": "PSE", "Kosovo": "XKX",
    "Democratic Republic of the Congo": "COD", "Congo, Democratic Republic": "COD",
    "Congo, Republic": "COG", "Republic of Congo": "COG",
    "Tanzania": "TZA", "United Republic of Tanzania": "TZA",
    "Syria": "SYR", "Syrian Arab Republic": "SYR",
    "Iran": "IRN", "Iran, Islamic Republic of": "IRN",
    "Bolivia": "BOL", "Bolivia, Plurinational State of": "BOL",
    "Venezuela": "VEN", "Venezuela, Bolivarian Republic of": "VEN",
    "Kyrgyzstan": "KGZ", "Kyrgyz Republic": "KGZ",
    "Laos": "LAO", "Lao PDR": "LAO", "Lao People's Democratic Republic": "LAO",
    "Vietnam": "VNM", "Viet Nam": "VNM",
    "North Korea": "PRK", "Korea, Democratic People's Republic of": "PRK",
    "East Timor": "TLS", "Timor-Leste": "TLS",
    "Sao Tome and Principe": "STP", "São Tomé and Príncipe": "STP",
    "Sudan (former)": "SDN", "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV",
    "Myanmar": "MMR", "Burma": "MMR",
    "Macedonia": "MKD", "North Macedonia": "MKD",
    "Moldova": "MDA", "Republic of Moldova": "MDA",
    "Cape Verde": "CPV",
    "United Kingdom": "GBR", "United States": "USA",
    "United States of America": "USA", "France": "FRA", "Germany": "DEU",
    "Netherlands": "NLD", "Switzerland": "CHE", "Sweden": "SWE",
    "Norway": "NOR", "Denmark": "DNK", "Australia": "AUS",
    "Canada": "CAN", "Japan": "JPN", "Italy": "ITA", "Spain": "ESP",
    "Belgium": "BEL", "Austria": "AUT", "Finland": "FIN",
    "Ireland": "IRL", "Luxembourg": "LUX", "New Zealand": "NZL",
    "Portugal": "PRT", "Singapore": "SGP", "Hong Kong": "HKG",
    "Israel": "ISR", "United Arab Emirates": "ARE", "Kuwait": "KWT",
    "Qatar": "QAT", "Saudi Arabia": "SAU",
}


def name_to_iso3(name: str) -> str | None:
    if name in NAME_OVERRIDES:
        return NAME_OVERRIDES[name]
    try:
        results = pycountry.countries.search_fuzzy(name)
        if results:
            return results[0].alpha_3
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

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "country_centroids.csv")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["iso3", "name", "lat", "lon", "continent"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} countries to {out_path}")


if __name__ == "__main__":
    main()

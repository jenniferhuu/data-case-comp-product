import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/api/filters': [
      './data/generated/filters.json',
    ],
    '/api/globe': [
      './data/generated/globe.json',
      './public/data/countries_geo.json',
    ],
    '/api/overview': [
      './data/generated/overview.json',
      './data/generated/globe.json',
      './public/data/donor_summary.json',
      './public/data/country_summary.json',
    ],
    '/api/drilldown': [
      './data/generated/globe.json',
      './public/data/donor_summary.json',
      './public/data/country_summary.json',
    ],
  },
}

export default nextConfig

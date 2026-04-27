import { overviewResponseSchema, type OverviewResponse } from '../../contracts/overview'
import { readArtifactJson } from '../repositories/artifactRepository'
import { readCountrySummary, readDonorSummary } from '../repositories/dashboardRepository'
import { normalizeSectorLabel } from '../../lib/sectorLabels'
import { z } from 'zod'

const globeFlowSchema = z.object({
  year: z.number(),
  amountUsdM: z.number(),
  sector: z.string(),
})

const globeArtifactSchema = z.object({
  flows: z.array(globeFlowSchema),
})

function round4(value: number) {
  return Number(value.toFixed(4))
}

export async function getOverview(): Promise<OverviewResponse> {
  const artifact = await readArtifactJson('overview')
  const overview = overviewResponseSchema.pick({
    totals: true,
    highlights: true,
  }).parse(artifact)
  const globe = globeArtifactSchema.parse(await readArtifactJson('globe'))
  const [donors, countries] = await Promise.all([readDonorSummary(), readCountrySummary()])

  const yearlyTotals = new Map<number, number>()
  const sectorTotals = new Map<string, number>()

  for (const flow of globe.flows) {
    if (flow.year <= 0) {
      continue
    }

    yearlyTotals.set(flow.year, (yearlyTotals.get(flow.year) ?? 0) + flow.amountUsdM)
    const sector = normalizeSectorLabel(flow.sector)
    sectorTotals.set(sector, (sectorTotals.get(sector) ?? 0) + flow.amountUsdM)
  }

  return overviewResponseSchema.parse({
    ...overview,
    topSectors: [...sectorTotals.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([label, usdM]) => ({
        label,
        totalUsdM: round4(usdM),
      })),
    topRecipients: countries
      .slice()
      .sort((left, right) => right.total_received_usd_m - left.total_received_usd_m)
      .slice(0, 6)
      .map((country) => ({
        id: country.iso3,
        label: country.name,
        totalUsdM: round4(country.total_received_usd_m),
      })),
    topDonors: donors
      .slice()
      .sort((left, right) => right.total_usd_m - left.total_usd_m)
      .slice(0, 30)
      .map((donor) => ({
        id: donor.donor_id,
        label: donor.donor_name,
        totalUsdM: round4(donor.total_usd_m),
        country: donor.donor_country,
      })),
    yearlyFunding: [...yearlyTotals.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([year, usdM]) => ({
        year,
        totalUsdM: round4(usdM),
      })),
  })
}

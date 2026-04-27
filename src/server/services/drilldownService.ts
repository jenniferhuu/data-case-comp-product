import { dashboardQuerySchema } from '../../contracts/filters'
import { drilldownResponseSchema, type DrilldownResponse } from '../../contracts/drilldown'
import { z } from 'zod'
import { readArtifactJson } from '../repositories/artifactRepository'
import { readCountrySummary, readDonorSummary } from '../repositories/dashboardRepository'

const globeFlowSchema = z.object({
  donorId: z.string(),
  donorName: z.string(),
  donorCountry: z.string(),
  recipientIso3: z.string(),
  recipientName: z.string(),
  year: z.number(),
  amountUsdM: z.number(),
  sector: z.string(),
})

const globeArtifactSchema = z.object({
  flows: z.array(globeFlowSchema),
})

function parseDashboardQuery(searchParams?: URLSearchParams) {
  if (searchParams === undefined) {
    return dashboardQuerySchema.parse({})
  }

  return dashboardQuerySchema.parse(Object.fromEntries(searchParams.entries()))
}

function hyphenateId(value: string) {
  return value.replace(/_/g, '-')
}

function round1(value: number) {
  return Number(value.toFixed(1))
}

function round4(value: number) {
  return Number(value.toFixed(4))
}

export async function getDrilldown(searchParams?: URLSearchParams): Promise<DrilldownResponse> {
  const query = parseDashboardQuery(searchParams)
  const globe = globeArtifactSchema.parse(await readArtifactJson('globe'))

  if (query.selectionType === 'donor' && query.selectionId !== undefined) {
    const donors = await readDonorSummary()
    const donor = donors.find((entry) => hyphenateId(entry.donor_id) === query.selectionId)

    if (donor === undefined) {
      return drilldownResponseSchema.parse({ donor: null, country: null })
    }

    const yearlyTotals = new Map<number, number>()
    for (const flow of globe.flows) {
      if (flow.year <= 0 || flow.donorId !== query.selectionId) {
        continue
      }

      yearlyTotals.set(flow.year, (yearlyTotals.get(flow.year) ?? 0) + flow.amountUsdM)
    }

    return drilldownResponseSchema.parse({
      donor: {
        id: query.selectionId,
        name: donor.donor_name,
        country: donor.donor_country,
        totalUsdM: round4(donor.total_usd_m),
        recipientCount: donor.n_countries,
        topRecipientShare: round1(((donor.top_recipients[0]?.usd_m ?? 0) / donor.total_usd_m) * 100),
        yearlyFunding: [...yearlyTotals.entries()]
          .sort((left, right) => left[0] - right[0])
          .map(([year, usdM]) => ({ year, totalUsdM: round4(usdM) })),
        sectorBreakdown: donor.top_sectors.map((item) => ({
          sector: item.name,
          totalUsdM: round4(item.usd_m),
        })),
        topRecipients: donor.top_recipients.map((item) => ({
          iso3: item.iso3,
          name: item.name,
          totalUsdM: round4(item.usd_m),
        })),
      },
      country: null,
    })
  }

  if (query.selectionType === 'country' && query.selectionId !== undefined) {
    const countries = await readCountrySummary()
    const country = countries.find(
      (entry) => entry.iso3 === query.selectionId || entry.name === query.selectionId,
    )

    if (country === undefined) {
      return drilldownResponseSchema.parse({ donor: null, country: null })
    }

    const donors = await readDonorSummary()
    const donorCountryById = new Map(donors.map((entry) => [entry.donor_id, entry.donor_country]))

    return drilldownResponseSchema.parse({
      donor: null,
      country: {
        iso3: country.iso3,
        name: country.name,
        totalUsdM: round4(country.total_received_usd_m),
        donorCount: country.n_donors,
        topDonorShare: round1(((country.top_donors[0]?.usd_m ?? 0) / country.total_received_usd_m) * 100),
        yearlyFunding: Object.entries(country.by_year)
          .map(([year, usdM]) => ({ year: Number(year), totalUsdM: round4(usdM) }))
          .sort((left, right) => left.year - right.year),
        sectorBreakdown: country.top_sectors.map((item) => ({
          sector: item.name,
          totalUsdM: round4(item.usd_m),
        })),
        topDonors: country.top_donors.map((item) => ({
          id: hyphenateId(item.donor_id),
          name: item.donor_name,
          country: donorCountryById.get(item.donor_id) ?? 'Unknown',
          totalUsdM: round4(item.usd_m),
        })),
      },
    })
  }

  return drilldownResponseSchema.parse({ donor: null, country: null })
}

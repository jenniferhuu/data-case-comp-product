import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { REPO_ROOT } from '../../pipeline/config'

const donorSummaryEntrySchema = z.object({
  donor_id: z.string(),
  donor_name: z.string(),
  donor_country: z.string(),
  donor_iso3: z.string(),
  total_usd_m: z.number(),
  n_projects: z.number(),
  n_countries: z.number(),
  rank: z.number().nullable(),
  top_sectors: z.array(z.object({
    name: z.string(),
    usd_m: z.number(),
  })),
  top_recipients: z.array(z.object({
    iso3: z.string(),
    name: z.string(),
    usd_m: z.number(),
  })),
  year_range: z.tuple([z.number(), z.number()]),
})

const countrySummaryEntrySchema = z.object({
  iso3: z.string(),
  name: z.string(),
  total_received_usd_m: z.number(),
  n_donors: z.number(),
  n_projects: z.number(),
  top_donors: z.array(z.object({
    donor_id: z.string(),
    donor_name: z.string(),
    usd_m: z.number(),
  })),
  top_sectors: z.array(z.object({
    name: z.string(),
    usd_m: z.number(),
  })),
  by_year: z.record(z.string(), z.number()),
})

const donorSummarySchema = z.array(donorSummaryEntrySchema)
const countrySummarySchema = z.array(countrySummaryEntrySchema)

type DonorSummaryEntry = z.infer<typeof donorSummaryEntrySchema>
type CountrySummaryEntry = z.infer<typeof countrySummaryEntrySchema>

const donorSummaryPath = join(REPO_ROOT, 'public', 'data', 'donor_summary.json')
const countrySummaryPath = join(REPO_ROOT, 'public', 'data', 'country_summary.json')

let donorSummaryCache: DonorSummaryEntry[] | null = null
let countrySummaryCache: CountrySummaryEntry[] | null = null

export async function readDonorSummary(): Promise<DonorSummaryEntry[]> {
  if (donorSummaryCache !== null) {
    return donorSummaryCache
  }

  const content = await readFile(donorSummaryPath, 'utf8')
  donorSummaryCache = donorSummarySchema.parse(JSON.parse(content))
  return donorSummaryCache
}

export async function readCountrySummary(): Promise<CountrySummaryEntry[]> {
  if (countrySummaryCache !== null) {
    return countrySummaryCache
  }

  const content = await readFile(countrySummaryPath, 'utf8')
  countrySummaryCache = countrySummarySchema.parse(JSON.parse(content))
  return countrySummaryCache
}

import { z } from 'zod'

export const heroTotalsSchema = z.object({
  fundingUsdM: z.number(),
  donors: z.number(),
  countries: z.number(),
  corridors: z.number(),
})

export const overviewHighlightSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  tone: z.enum(['neutral', 'positive', 'warning']),
})

export const overviewDistributionSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  totalUsdM: z.number(),
})

export const overviewTopDonorSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  totalUsdM: z.number(),
  country: z.string(),
})

export const overviewYearlyFundingSchema = z.object({
  year: z.number(),
  totalUsdM: z.number(),
})

export const overviewModalitySchema = z.object({
  label: z.string(),
  totalUsdM: z.number(),
})

export const overviewResponseSchema = z.object({
  totals: heroTotalsSchema,
  highlights: z.array(overviewHighlightSchema),
  topSectors: z.array(overviewDistributionSchema),
  topRecipients: z.array(overviewDistributionSchema),
  topDonors: z.array(overviewTopDonorSchema),
  yearlyFunding: z.array(overviewYearlyFundingSchema),
  modalityBreakdown: z.array(overviewModalitySchema),
})

export type OverviewResponse = z.infer<typeof overviewResponseSchema>

import { z } from 'zod'

export const yearlyFundingSchema = z.object({
  year: z.number(),
  totalUsdM: z.number(),
})

export const fundingBreakdownSchema = z.object({
  sector: z.string(),
  totalUsdM: z.number(),
})

export const topRecipientSchema = z.object({
  iso3: z.string(),
  name: z.string(),
  totalUsdM: z.number(),
})

export const topDonorSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  totalUsdM: z.number(),
})

export const donorDrilldownSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  totalUsdM: z.number(),
  recipientCount: z.number(),
  topRecipientShare: z.number(),
  yearlyFunding: z.array(yearlyFundingSchema),
  sectorBreakdown: z.array(fundingBreakdownSchema),
  topRecipients: z.array(topRecipientSchema),
})

export const countryDrilldownSchema = z.object({
  iso3: z.string(),
  name: z.string(),
  totalUsdM: z.number(),
  donorCount: z.number(),
  topDonorShare: z.number(),
  yearlyFunding: z.array(yearlyFundingSchema),
  sectorBreakdown: z.array(fundingBreakdownSchema),
  topDonors: z.array(topDonorSchema),
})

export const drilldownResponseSchema = z.object({
  donor: donorDrilldownSchema.nullable(),
  country: countryDrilldownSchema.nullable(),
})

export type DrilldownResponse = z.infer<typeof drilldownResponseSchema>

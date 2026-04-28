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

export const topImplementerSchema = z.object({
  name: z.string(),
  totalUsdM: z.number(),
})

export const modalityBreakdownItemSchema = z.object({
  label: z.string(),
  totalUsdM: z.number(),
})

export const flowGeographySchema = z.object({
  crossBorderPct: z.number(),
  domesticPct: z.number(),
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
  topImplementers: z.array(topImplementerSchema),
  modalityBreakdown: z.array(modalityBreakdownItemSchema),
  flowGeography: flowGeographySchema,
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
  topImplementers: z.array(topImplementerSchema),
})

export const donorCountryDrilldownSchema = z.object({
  name: z.string(),
  totalUsdM: z.number(),
  donorCount: z.number(),
  recipientCount: z.number(),
  topDonors: z.array(topDonorSchema),
  sectorBreakdown: z.array(fundingBreakdownSchema),
  yearlyFunding: z.array(yearlyFundingSchema),
  topRecipients: z.array(topRecipientSchema),
  topImplementers: z.array(topImplementerSchema),
  modalityBreakdown: z.array(modalityBreakdownItemSchema),
  flowGeography: flowGeographySchema,
})

export const drilldownResponseSchema = z.object({
  donor: donorDrilldownSchema.nullable(),
  country: countryDrilldownSchema.nullable(),
  donorCountry: donorCountryDrilldownSchema.nullable(),
})

export type DrilldownResponse = z.infer<typeof drilldownResponseSchema>

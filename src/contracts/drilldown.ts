import { z } from 'zod'

export const donorDrilldownSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  totalUsdM: z.number(),
})

export const countryDrilldownSchema = z.object({
  iso3: z.string(),
  name: z.string(),
  totalUsdM: z.number(),
})

export const drilldownResponseSchema = z.object({
  donor: donorDrilldownSchema.nullable(),
  country: countryDrilldownSchema.nullable(),
})

export type DrilldownResponse = z.infer<typeof drilldownResponseSchema>

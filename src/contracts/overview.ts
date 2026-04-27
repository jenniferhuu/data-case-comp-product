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

export const overviewResponseSchema = z.object({
  totals: heroTotalsSchema,
  highlights: z.array(overviewHighlightSchema),
})

export type OverviewResponse = z.infer<typeof overviewResponseSchema>

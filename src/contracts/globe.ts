import { z } from 'zod'

export const globeFlowSchema = z.object({
  donorId: z.string(),
  donorName: z.string(),
  donorCountry: z.string(),
  recipientIso3: z.string(),
  recipientName: z.string(),
  year: z.number(),
  amountUsdM: z.number(),
  sector: z.string(),
})

export const globeResponseSchema = z.object({
  flows: z.array(globeFlowSchema),
})

export type GlobeResponse = z.infer<typeof globeResponseSchema>

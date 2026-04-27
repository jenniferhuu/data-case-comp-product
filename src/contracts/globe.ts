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

export const globeArtifactSchema = z.object({
  flows: z.array(globeFlowSchema),
})

export const globeArcSchema = z.object({
  donorId: z.string(),
  donorName: z.string(),
  donorCountry: z.string(),
  donorLat: z.number(),
  donorLon: z.number(),
  recipientIso3: z.string(),
  recipientName: z.string(),
  recipientLat: z.number(),
  recipientLon: z.number(),
  amountUsdM: z.number(),
  years: z.array(z.number()),
  yearAmounts: z.array(z.object({
    year: z.number(),
    totalUsdM: z.number(),
  })),
  sector: z.string(),
})

export const globePointSchema = z.object({
  iso3: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  totalUsdM: z.number(),
  donorCount: z.number(),
})

export const globeResponseSchema = z.object({
  arcs: z.array(globeArcSchema),
  points: z.array(globePointSchema),
  visibleFundingUsdM: z.number(),
  crossBorderPct: z.number(),
  domesticPct: z.number(),
})

export type GlobeArtifact = z.infer<typeof globeArtifactSchema>
export type GlobeResponse = z.infer<typeof globeResponseSchema>

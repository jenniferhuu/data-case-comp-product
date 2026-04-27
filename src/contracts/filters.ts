import { z } from 'zod'
import { ALL_MARKERS, type MarkerKey } from '../types'

const markerValues = ALL_MARKERS as [MarkerKey, ...MarkerKey[]]
const strictQueryNumberSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      return Number.NaN
    }

    return Number(trimmed)
  }

  return Number.NaN
}, z.number().finite())

export const dashboardQuerySchema = z.object({
  yearMode: z.enum(['all', 'single', 'compare']).default('all'),
  year: strictQueryNumberSchema.optional(),
  compareFrom: strictQueryNumberSchema.optional(),
  compareTo: strictQueryNumberSchema.optional(),
  valueMode: z.enum(['disbursements', 'commitments']).default('disbursements'),
  donor: z.string().optional(),
  donorCountry: z.string().optional(),
  recipientCountry: z.string().optional(),
  sector: z.string().optional(),
  marker: z.enum(markerValues).optional(),
  selectionType: z.enum(['country', 'donor', 'donorCountry']).optional(),
  selectionId: z.string().optional(),
}).superRefine((query, ctx) => {
  if (query.yearMode === 'single' && query.year === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['year'],
      message: 'year is required when yearMode is single',
    })
  }

  if (query.yearMode === 'compare') {
    if (query.compareFrom === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['compareFrom'],
        message: 'compareFrom is required when yearMode is compare',
      })
    }

    if (query.compareTo === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['compareTo'],
        message: 'compareTo is required when yearMode is compare',
      })
    }
  }

  if (query.selectionType !== undefined && query.selectionId === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['selectionId'],
      message: 'selectionId is required when selectionType is provided',
    })
  }

  if (query.selectionId !== undefined && query.selectionType === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['selectionType'],
      message: 'selectionType is required when selectionId is provided',
    })
  }
})

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>

import { describe, expect, it } from 'vitest'
import { dashboardQuerySchema } from '../../src/contracts/filters'
import { drilldownResponseSchema } from '../../src/contracts/drilldown'
import { overviewResponseSchema } from '../../src/contracts/overview'

describe('shared contracts', () => {
  it('parses the overview payload shape', () => {
    const parsed = overviewResponseSchema.parse({
      totals: { fundingUsdM: 1, donors: 2, countries: 3, corridors: 4 },
      highlights: [],
      topSectors: [],
      topRecipients: [],
      topDonors: [],
      yearlyFunding: [],
      modalityBreakdown: [],
      commitmentProgress: { disbursedPct: 62.1 },
    })

    expect(parsed.totals.donors).toBe(2)
  })

  it('parses a valid single-year filter query from raw query values', () => {
    const parsed = dashboardQuerySchema.parse({
      yearMode: 'single',
      year: '2023',
      marker: 'gender',
      valueMode: 'commitments',
      selectionType: 'country',
      selectionId: 'UKR',
    })

    expect(parsed.year).toBe(2023)
    expect(parsed.marker).toBe('gender')
    expect(parsed.valueMode).toBe('commitments')
    expect(parsed.selectionId).toBe('UKR')
  })

  it('parses a valid compare filter query from raw query values', () => {
    const parsed = dashboardQuerySchema.parse({
      yearMode: 'compare',
      compareFrom: '2021',
      compareTo: '2023',
      marker: 'nutrition',
      valueMode: 'disbursements',
      selectionType: 'donor',
      selectionId: 'ford-foundation',
    })

    expect(parsed.compareFrom).toBe(2021)
    expect(parsed.compareTo).toBe(2023)
    expect(parsed.valueMode).toBe('disbursements')
    expect(parsed.selectionType).toBe('donor')
  })

  it('defaults valueMode to disbursements', () => {
    const parsed = dashboardQuerySchema.parse({})

    expect(parsed.valueMode).toBe('disbursements')
  })

  it('rejects single-year mode without year', () => {
    const result = dashboardQuerySchema.safeParse({ yearMode: 'single' })

    expect(result.success).toBe(false)
    expect(result.error.issues.some((issue) => issue.path[0] === 'year')).toBe(true)
  })

  it('rejects compare mode without both compare years', () => {
    const missingCompareTo = dashboardQuerySchema.safeParse({ yearMode: 'compare', compareFrom: '2021' })
    const missingCompareFrom = dashboardQuerySchema.safeParse({ yearMode: 'compare', compareTo: '2023' })

    expect(missingCompareTo.success).toBe(false)
    expect(missingCompareTo.error.issues.some((issue) => issue.path[0] === 'compareTo')).toBe(true)
    expect(missingCompareFrom.success).toBe(false)
    expect(missingCompareFrom.error.issues.some((issue) => issue.path[0] === 'compareFrom')).toBe(true)
  })

  it('rejects blank year input instead of coercing it to zero', () => {
    const emptyString = dashboardQuerySchema.safeParse({ yearMode: 'single', year: '' })
    const whitespaceString = dashboardQuerySchema.safeParse({ yearMode: 'single', year: '   ' })
    const nullValue = dashboardQuerySchema.safeParse({ yearMode: 'single', year: null })

    expect(emptyString.success).toBe(false)
    expect(emptyString.error.issues.some((issue) => issue.path[0] === 'year')).toBe(true)
    expect(whitespaceString.success).toBe(false)
    expect(whitespaceString.error.issues.some((issue) => issue.path[0] === 'year')).toBe(true)
    expect(nullValue.success).toBe(false)
    expect(nullValue.error.issues.some((issue) => issue.path[0] === 'year')).toBe(true)
  })

  it('rejects blank compare year inputs instead of coercing them to zero', () => {
    const blankCompareFrom = dashboardQuerySchema.safeParse({
      yearMode: 'compare',
      compareFrom: '',
      compareTo: '2023',
    })
    const blankCompareTo = dashboardQuerySchema.safeParse({
      yearMode: 'compare',
      compareFrom: '2021',
      compareTo: ' ',
    })

    expect(blankCompareFrom.success).toBe(false)
    expect(blankCompareFrom.error.issues.some((issue) => issue.path[0] === 'compareFrom')).toBe(true)
    expect(blankCompareTo.success).toBe(false)
    expect(blankCompareTo.error.issues.some((issue) => issue.path[0] === 'compareTo')).toBe(true)
  })

  it('rejects partial selection state', () => {
    const missingSelectionId = dashboardQuerySchema.safeParse({ selectionType: 'country' })
    const missingSelectionType = dashboardQuerySchema.safeParse({ selectionId: 'UKR' })

    expect(missingSelectionId.success).toBe(false)
    expect(missingSelectionId.error.issues.some((issue) => issue.path[0] === 'selectionId')).toBe(true)
    expect(missingSelectionType.success).toBe(false)
    expect(missingSelectionType.error.issues.some((issue) => issue.path[0] === 'selectionType')).toBe(true)
  })

  it('rejects unknown marker values', () => {
    const result = dashboardQuerySchema.safeParse({
      yearMode: 'single',
      year: 2023,
      marker: 'unknown_marker',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues.some((issue) => issue.path[0] === 'marker')).toBe(true)
  })

  it('parses drilldown payloads with implementer rankings', () => {
    const parsed = drilldownResponseSchema.parse({
      donor: {
        id: 'gates-foundation',
        name: 'Gates Foundation',
        country: 'United States',
        totalUsdM: 10,
        recipientCount: 2,
        topRecipientShare: 50,
        yearlyFunding: [{ year: 2023, totalUsdM: 10 }],
        sectorBreakdown: [{ sector: 'Health', totalUsdM: 10 }],
        topRecipients: [{ iso3: 'UKR', name: 'Ukraine', totalUsdM: 10 }],
        topImplementers: [{ name: 'UNICEF', totalUsdM: 8 }],
        modalityBreakdown: [{ label: 'Grants', totalUsdM: 8 }, { label: 'Loans', totalUsdM: 2 }],
        flowGeography: { crossBorderPct: 80, domesticPct: 20 },
      },
      country: null,
      donorCountry: null,
    })

    expect(parsed.donor?.topImplementers[0]?.name).toBe('UNICEF')
  })
})

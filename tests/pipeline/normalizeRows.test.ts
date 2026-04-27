import { describe, expect, it } from 'vitest'
import { normalizeRows } from '../../src/pipeline/normalize/normalizeRows'

describe('normalizeRows', () => {
  it('maps a raw row into canonical entities', () => {
    const rows = normalizeRows([
      {
        year: '2022',
        donor_name: 'Example Foundation',
        donor_country: 'United States',
        recipient_name: 'Ukraine',
        usd_disbursed: '12.5',
        sector: 'Health',
      },
    ])

    expect(rows[0].year).toBe(2022)
    expect(rows[0].donor.name).toBe('Example Foundation')
    expect(rows[0].recipient.name).toBe('Ukraine')
  })

  it('normalizes blanks, alternate source columns, and malformed numerics deterministically', () => {
    const rows = normalizeRows([
      {
        year: '2022',
        donor_name: '   ',
        donor_country: '   ',
        recipient_name: '  Ukraine  ',
        recipient_iso3: '  ua  ',
        usd_disbursed: 'not-a-number',
        sector: '  Health  ',
      },
      {
        year: '2021',
        organization_name: '  Example Org  ',
        Donor_country: '  United Kingdom  ',
        country: '  Kenya  ',
        usd_disbursements_defl: 'Infinity',
        Sector: '  Biodiversity  ',
      },
      {
        year: '2020',
        donor_name: 'Example Foundation',
        donor_country: 'United States',
        recipient_name: 'Ukraine',
        usd_disbursed: '   ',
        usd_disbursed_m: '12.5',
        sector: 'Health',
      },
    ])

    expect(rows[0]).toMatchObject({
      year: 2022,
      amountUsdM: 0,
      sector: 'Health',
      donor: {
        id: 'unknown-donor',
        name: 'Unknown donor',
        country: 'Unknown',
      },
      recipient: {
        iso3: 'UA',
        name: 'Ukraine',
      },
    })

    expect(Number.isNaN(rows[0].amountUsdM)).toBe(false)

    expect(rows[1]).toMatchObject({
      year: 2021,
      amountUsdM: 0,
      sector: 'Biodiversity',
      donor: {
        id: 'example-org',
        name: 'Example Org',
        country: 'United Kingdom',
      },
      recipient: {
        iso3: 'UNK',
        name: 'Kenya',
      },
    })

    expect(Number.isFinite(rows[1].amountUsdM)).toBe(true)
    expect(rows[2].amountUsdM).toBe(12.5)
  })
})

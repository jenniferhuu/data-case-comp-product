import { describe, expect, it } from 'vitest'
import { ensureRequiredColumns } from '../../src/pipeline/index'

describe('ensureRequiredColumns', () => {
  it('accepts supported alias columns for the required pipeline semantics', () => {
    expect(() =>
      ensureRequiredColumns(
        [
          {
            year: '2022',
            donor_name: 'Example Foundation',
            recipient_name: 'Ukraine',
            donor_country: 'United States',
            usd_disbursed_m: '12.5',
            sector: 'Health',
          },
        ],
        [
          'year',
          ['donor_name', 'organization_name'],
          ['recipient_name', 'country'],
          ['donor_country', 'Donor_country'],
          ['usd_disbursed', 'usd_disbursed_m', 'usd_disbursements_defl'],
          ['sector', 'Sector'],
        ],
      ),
    ).not.toThrow()
  })

  it('throws when no supported donor-country alias is present', () => {
    expect(() =>
      ensureRequiredColumns(
        [
          {
            year: '2022',
            organization_name: 'Example Foundation',
            country: 'Ukraine',
            usd_disbursements_defl: '12.5',
            Sector: 'Health',
          },
        ],
        [
          'year',
          ['donor_name', 'organization_name'],
          ['recipient_name', 'country'],
          ['donor_country', 'Donor_country'],
          ['usd_disbursed', 'usd_disbursed_m', 'usd_disbursements_defl'],
          ['sector', 'Sector'],
        ],
      ),
    ).toThrowError(/donor_country/)
  })
})

import { describe, expect, it } from 'vitest'
import { ensureRequiredColumns } from '../../src/pipeline/index'

describe('ensureRequiredColumns', () => {
  it('throws when a required column is missing from the input rows', () => {
    expect(() =>
      ensureRequiredColumns(
        [
          {
            donor_name: 'Example Foundation',
            recipient_name: 'Ukraine',
          },
        ],
        ['year', 'donor_name', 'recipient_name'],
      ),
    ).toThrowError(/year/)
  })

  it('allows rows that contain every required column', () => {
    expect(() =>
      ensureRequiredColumns(
        [
          {
            year: '2022',
            donor_name: 'Example Foundation',
            recipient_name: 'Ukraine',
          },
        ],
        ['year', 'donor_name', 'recipient_name'],
      ),
    ).not.toThrow()
  })
})

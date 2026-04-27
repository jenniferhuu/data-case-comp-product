import { describe, expect, it } from 'vitest'
import { loadPrimaryCsv } from '../../src/pipeline/loaders/loadPrimaryCsv'
import { runPipeline } from '../../src/pipeline/index'
import { loadEnrichment } from '../../src/pipeline/loaders/loadEnrichment'

describe('loadPrimaryCsv', () => {
  it('returns rows from the primary dataset', async () => {
    const rows = await loadPrimaryCsv()

    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toMatchObject({
      year: expect.any(String),
      organization_name: expect.any(String),
      Donor_country: expect.any(String),
      Sector: expect.any(String),
    })
    expect(rows[0].year.length).toBeGreaterThan(0)
    expect(rows[0].organization_name.length).toBeGreaterThan(0)
  })

  it('reports a summary derived from the loaded primary dataset', async () => {
    const result = await runPipeline()

    expect(result).toMatchObject({
      ok: true,
      primaryRowCount: expect.any(Number),
      primaryCsvPath: expect.stringContaining('data'),
      usedCommittedArtifacts: false,
    })
    expect(result.primaryRowCount).toBeGreaterThan(0)
  })

  it('rejects invalid enrichment file names', async () => {
    await expect(loadEnrichment('')).rejects.toThrow(/plain file name/i)
    await expect(loadEnrichment('.')).rejects.toThrow(/plain file name/i)
    await expect(loadEnrichment('..')).rejects.toThrow(/plain file name/i)
    await expect(loadEnrichment('subdir/file.csv')).rejects.toThrow(/plain file name/i)
    await expect(loadEnrichment('C:/absolute/file.csv')).rejects.toThrow(/plain file name/i)
  })
})

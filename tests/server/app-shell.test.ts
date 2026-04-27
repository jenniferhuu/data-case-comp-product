import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Next app shell scaffold', () => {
  it('has an app router entrypoint', () => {
    expect(existsSync('src/app/page.tsx')).toBe(true)
    expect(existsSync('src/app/layout.tsx')).toBe(true)
  })

  it('delegates the app router page to the next dashboard shell', () => {
    const pageSource = readFileSync('src/app/page.tsx', 'utf8')

    expect(pageSource).toContain('../components/dashboard/DashboardShell')
    expect(pageSource).toMatch(/<DashboardShell\s*\/>/)
    expect(pageSource).not.toContain('DashboardAppClient')
  })

  it('loads global css from the root layout', () => {
    const layoutSource = readFileSync('src/app/layout.tsx', 'utf8')

    expect(layoutSource).toContain("import './globals.css'")
  })

  it('keeps a guarded pipeline cli entrypoint', () => {
    const pipelineSource = readFileSync('src/pipeline/index.ts', 'utf8')

    expect(pipelineSource).toContain('export async function runPipeline()')
    expect(pipelineSource).toContain('if (entryPath === modulePath)')
    expect(pipelineSource).toContain('Pipeline scaffold complete')
  })
})

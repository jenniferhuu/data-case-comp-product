import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Next app shell scaffold', () => {
  it('has an app router entrypoint', () => {
    expect(existsSync('src/app/page.tsx')).toBe(true)
    expect(existsSync('src/app/layout.tsx')).toBe(true)
  })

  it('delegates the app router page to the client dashboard wrapper', () => {
    const pageSource = readFileSync('src/app/page.tsx', 'utf8')
    const wrapperSource = readFileSync('src/app/DashboardAppClient.tsx', 'utf8')

    expect(pageSource).toContain("./DashboardAppClient")
    expect(pageSource).not.toContain("next/dynamic")
    expect(pageSource).toMatch(/<DashboardAppClient\s*\/>/)

    expect(wrapperSource).toContain("'use client'")
    expect(wrapperSource).toContain("next/dynamic")
    expect(wrapperSource).toContain("../App")
    expect(wrapperSource).toContain("ssr: false")
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

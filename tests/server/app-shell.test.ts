import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('Next app shell scaffold', () => {
  it('has an app router entrypoint', () => {
    expect(existsSync('src/app/page.tsx')).toBe(true)
    expect(existsSync('src/app/layout.tsx')).toBe(true)
  })

  it('renders the dashboard shell directly from the app router page', () => {
    const pageSource = readFileSync('src/app/page.tsx', 'utf8')

    expect(pageSource).toContain("../components/dashboard/DashboardShell")
    expect(pageSource).not.toContain("next/dynamic")
    expect(pageSource).toMatch(/<DashboardShell\s*\/>/)
  })

  it('loads global css from the root layout', () => {
    const layoutSource = readFileSync('src/app/layout.tsx', 'utf8')

    expect(layoutSource).toContain("import './globals.css'")
  })

  it('runs the declared pipeline entrypoint', () => {
    const pipelineSource = readFileSync('src/pipeline/index.ts', 'utf8')
    const output = execSync('npm run pipeline', {
      cwd: process.cwd(),
      encoding: 'utf8',
    })

    expect(pipelineSource).toContain('export async function runPipeline()')
    expect(output).toContain('Pipeline scaffold complete')
  })
})

import { expect, test } from '@playwright/test'

test('dashboard homepage loads', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })

  await page.goto('/')
  await expect(page.getByText('PhilanthroGlobe').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Global funding command center' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Filter the global flow map' })).toBeVisible()
  await expect(page.getByText('Funding tracked')).toBeVisible()
  await expect(page.locator('canvas').first()).toBeVisible()
  expect(pageErrors).toEqual([])
})

import { expect, test } from '@playwright/test'

test('dashboard homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('PhilanthroGlobe').first()).toBeVisible()
  await expect(page.locator('canvas').first()).toBeVisible()
})

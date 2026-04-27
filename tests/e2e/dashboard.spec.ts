import { expect, test } from '@playwright/test'

test('dashboard homepage loads', async ({ page }) => {
  await page.goto('http://127.0.0.1:3000')
  await expect(page.locator('[data-testid="dashboard-shell"]')).toBeVisible()
})

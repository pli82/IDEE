// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Aceste teste necesită un user autentificat — folosiți storageState sau setup fixture
test.describe('Dashboard (unauthenticated)', () => {
  test('Redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('Admin redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/admin`)
    await expect(page).toHaveURL(/auth\/login/)
  })
})

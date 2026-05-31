// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

test.describe('Auth flows', () => {
  test('Homepage shows login and register buttons', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByRole('link', { name: /autentificare/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /înregistrare/i })).toBeVisible()
  })

  test('Login page renders form', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await expect(page.getByPlaceholder(/adresa@email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /autentificare/i })).toBeVisible()
  })

  test('Register page renders form', async ({ page }) => {
    await page.goto(`${BASE}/auth/register`)
    await expect(page.getByText(/creare cont/i)).toBeVisible()
  })

  test('Forgot password page renders', async ({ page }) => {
    await page.goto(`${BASE}/auth/forgot-password`)
    await expect(page.getByText(/recuperare parolă/i)).toBeVisible()
  })

  test('Invalid login shows error', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await page.fill('input[type="email"]', 'wrong@test.ro')
    await page.fill('input[type="password"]', 'WrongPass1!')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 })
  })
})

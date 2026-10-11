import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Smoke: marketing renders → login boots → dashboard gates to login when logged out.
 * Full CRUD flows run against preview with a seeded org (CI secret).
 */
test.describe('marketing + auth gating', () => {
  test('home renders with hero copy', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Better Properties');
  });

  test('services/about/contact render', async ({ page }) => {
    for (const path of ['/services', '/about', '/contact']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('dashboard redirects logged-out users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page has no axe violations', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

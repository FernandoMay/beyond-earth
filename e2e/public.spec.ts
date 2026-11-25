import { expect, test } from '@playwright/test';

test.describe('public reference site', () => {
  test('home presents the network and the demo disclosure', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Financing the infrastructure beyond Earth',
    );
    await expect(page.getByText(/all assets and returns illustrative/i).first()).toBeVisible();
    await expect(page.getByText(/no offer of securities/i).first()).toBeVisible();
  });

  test('marketplace labels every structure as illustrative', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Verified structures');
    await expect(page.getByText(/illustrative/i).first()).toBeVisible();
    await expect(page.getByText('Reference Turbofan Engine Lease').first()).toBeVisible();
  });

  test('asset detail shows evidence and token-rights boundaries', async ({ page }) => {
    await page.goto('/assets/reference-turbofan-engine-lease');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Reference Turbofan');
    await expect(page.getByText(/not.*title|does not.*own|no.*ownership/i).first()).toBeVisible();
  });

  test('protocol page explains contracts without fake addresses', async ({ page }) => {
    await page.goto('/protocol');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Protocol');
    await expect(page.locator('body')).not.toContainText('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  });
});

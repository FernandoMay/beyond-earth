import { expect, test } from '@playwright/test';

test.describe('investor portal', () => {
  test('portfolio and distributions remain demo-only', async ({ page }) => {
    await page.goto('http://localhost:3001/portfolio');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Portfolio');
    await expect(page.getByText(/illustrative/i).first()).toBeVisible();

    await page.goto('http://localhost:3001/distributions');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Distributions');
    await expect(page.getByText(/revenue records are synthetic/i)).toBeVisible();
    await expect(page.getByText(/claiming is disabled/i)).toBeVisible();
  });
});

test.describe('issuer portal', () => {
  test('asset pipeline and new-structure wizard are labelled', async ({ page }) => {
    await page.goto('http://localhost:3002/assets');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Asset pipeline');
    await expect(page.getByText(/demo registry/i).first()).toBeVisible();

    await page.goto('http://localhost:3002/assets/new');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('New structure');
  });
});

test.describe('admin portal', () => {
  test('compliance decisions are disabled', async ({ page }) => {
    await page.goto('http://localhost:3003/compliance');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Compliance queue');
    await expect(page.getByText(/decisions are disabled/i)).toBeVisible();
    await expect(page.getByText(/fabricated/i)).toBeVisible();
  });
});

test.describe('operations portal', () => {
  test('task queue is explicitly synthetic', async ({ page }) => {
    await page.goto('http://localhost:3004/tasks');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Task queue');
    await expect(page.getByText(/synthetic/i).first()).toBeVisible();
  });
});

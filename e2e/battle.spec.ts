import { test, expect } from 'playwright/test';

test.describe('Battle Page', () => {
  test('shows title, dual inputs, and famous duels', async ({ page }) => {
    await page.goto('/battle');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Wallet Battle');
    await expect(page.getByText('Whose wallet reigns supreme?')).toBeVisible();

    // Famous duels
    await expect(page.getByText('Famous Duels')).toBeVisible();
    await expect(page.getByRole('button', { name: /Vitalik vs Uniswap/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /ENS vs Aave/ })).toBeVisible();

    // Back link
    await expect(page.getByText('Back to character generation')).toBeVisible();
  });

  test('famous duel button navigates to battle result page', async ({ page }) => {
    await page.goto('/battle');

    await page.getByRole('button', { name: /Vitalik vs Uniswap/ }).click();

    await page.waitForURL(/\/battle\/vitalik\.eth\//);
  });

  test('back link navigates to landing page', async ({ page }) => {
    await page.goto('/battle');

    await page.getByText('Back to character generation').click();

    await page.waitForURL('/');
  });
});

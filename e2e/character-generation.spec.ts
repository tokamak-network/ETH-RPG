import { test, expect } from 'playwright/test';

const MOCK_GENERATE_RESPONSE = {
  address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  ensName: 'vitalik.eth',
  stats: {
    level: 45,
    hp: 320,
    mp: 280,
    str: 150,
    int: 210,
    dex: 180,
    luck: 120,
    power: 42500,
  },
  class: {
    id: 'elder_wizard',
    name: 'Elder Wizard',
    nameEn: 'Elder Wizard',
  },
  lore: 'An ancient wizard who watched for ages.',
  longLore: 'An ancient wizard who watched for ages, accumulating wisdom from the earliest days of the blockchain realm.',
  achievements: [
    { id: 'genesis', name: 'Genesis', icon: '\u{1F31F}', tier: 'legendary', description: 'Early blockchain participant' },
  ],
  cardImageUrl: '/api/card/0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  ogImageUrl: '/api/og/0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  cached: false,
};

test.describe('Character Generation Flow', () => {
  test('shows character card after API resolves', async ({ page }) => {
    // Mock the generate API
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GENERATE_RESPONSE),
      });
    });

    await page.goto('/result/vitalik.eth');

    // Character card should appear after API resolves
    await expect(page.getByText('Elder Wizard').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('vitalik.eth').first()).toBeVisible();
    await expect(page.getByText('42,500').first()).toBeVisible();
    await expect(page.getByText('Combat Power').first()).toBeVisible();
  });

  test('shows stat bars on the character card', async ({ page }) => {
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GENERATE_RESPONSE),
      });
    });

    await page.goto('/result/vitalik.eth');

    await expect(page.getByText('Elder Wizard').first()).toBeVisible({ timeout: 10_000 });

    // Stat labels
    await expect(page.getByText('HP').first()).toBeVisible();
    await expect(page.getByText('MP').first()).toBeVisible();
    await expect(page.getByText('STR').first()).toBeVisible();
    await expect(page.getByText('INT').first()).toBeVisible();
    await expect(page.getByText('DEX').first()).toBeVisible();
    await expect(page.getByText('LUCK').first()).toBeVisible();
  });

  test('shows share buttons', async ({ page }) => {
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GENERATE_RESPONSE),
      });
    });

    await page.goto('/result/vitalik.eth');

    await expect(page.getByText('Elder Wizard').first()).toBeVisible({ timeout: 10_000 });

    // Share buttons should be present
    await expect(page.getByRole('button', { name: /Twitter/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Farcaster/ })).toBeVisible();
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'API_ERROR', message: 'Something went wrong. Please try again later.' },
        }),
      });
    });

    await page.goto('/result/vitalik.eth');

    await expect(page.getByText('Summoning Failed')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });

  test('Try Again button navigates back to landing', async ({ page }) => {
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'API_ERROR', message: 'Failed' },
        }),
      });
    });

    await page.goto('/result/vitalik.eth');

    await expect(page.getByText('Summoning Failed')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Try Again' }).click();

    await page.waitForURL('/');
  });

  test('battle CTA appears after card generation', async ({ page }) => {
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GENERATE_RESPONSE),
      });
    });

    await page.goto('/result/vitalik.eth');

    await expect(page.getByText('Elder Wizard').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Challenge another wallet to battle')).toBeVisible();
  });
});

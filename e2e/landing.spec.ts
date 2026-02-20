import { test, expect } from 'playwright/test';

test.describe('Landing Page', () => {
  test('shows title, input, classes, FAQ, and footer', async ({ page }) => {
    await page.goto('/');

    // Title
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Eth');

    // Address input
    const input = page.getByPlaceholder('0x... or vitalik.eth');
    await expect(input).toBeVisible();

    // Summon button (disabled until valid input)
    const button = page.getByRole('button', { name: /Summon/ });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();

    // Character classes section
    await expect(page.getByText('Character Classes')).toBeVisible();
    await expect(page.getByText('Hunter')).toBeVisible();
    await expect(page.getByText('Warrior')).toBeVisible();

    // FAQ
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible();

    // Footer
    await expect(page.getByText('Only public blockchain data is used')).toBeVisible();
  });

  test('enables submit button with valid address', async ({ page }) => {
    await page.goto('/');

    const input = page.getByPlaceholder('0x... or vitalik.eth');
    const button = page.getByRole('button', { name: /Summon/ });

    // Type a valid address
    await input.fill('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
    await expect(button).toBeEnabled();
  });

  test('enables submit button with valid ENS name', async ({ page }) => {
    await page.goto('/');

    const input = page.getByPlaceholder('0x... or vitalik.eth');
    const button = page.getByRole('button', { name: /Summon/ });

    await input.fill('vitalik.eth');
    await expect(button).toBeEnabled();
  });

  test('shows validation error for invalid input', async ({ page }) => {
    await page.goto('/');

    const input = page.getByPlaceholder('0x... or vitalik.eth');
    await input.fill('not-an-address');

    // Submit the form programmatically to trigger validation
    await page.locator('form').evaluate((form) => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await expect(page.getByText('Please enter a valid Ethereum address')).toBeVisible();
  });

  test('navigates to result page on valid submit', async ({ page }) => {
    await page.goto('/');

    const input = page.getByPlaceholder('0x... or vitalik.eth');
    await input.fill('vitalik.eth');
    await page.getByRole('button', { name: /Summon/ }).click();

    await page.waitForURL(/\/result\/vitalik\.eth/);
  });

  test('battle mode link navigates to battle page', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Battle Mode').click();
    await page.waitForURL('/battle');
  });
});

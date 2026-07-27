const { test, expect } = require('@playwright/test');

// Public candidate status lookup — two-factor (email + phone) so it can't
// enumerate. We assert the guardrails render; no RPC is fired.
test.describe('status.html', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/status.html'); });

  test('requires both email and mobile number', async ({ page }) => {
    await expect(page.locator('#s-email')).toHaveAttribute('required', '');
    await expect(page.locator('#s-phone')).toHaveAttribute('required', '');
  });

  test('shows the lookup form and keeps results hidden until a match', async ({ page }) => {
    await expect(page.locator('#lookup-card')).toBeVisible();
    await expect(page.locator('#result-card')).toBeHidden();
    await expect(page.getByText('RA 10173', { exact: false })).toBeVisible();
  });
});

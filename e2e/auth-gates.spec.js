const { test, expect } = require('@playwright/test');

// The two authenticated apps must always render their login gate. These assert
// the gate exists in the DOM without depending on a live session — catching
// accidental deletion of the auth UI, including after the ats.html script split.
test.describe('ATS auth gate', () => {
  test('login form is present', async ({ page }) => {
    await page.goto('/ats.html');
    await expect(page.locator('#cnt-login-form')).toHaveCount(1);
    await expect(page.locator('#cnt-email')).toHaveCount(1);
    await expect(page.locator('#cnt-pass')).toHaveCount(1);
  });

  test('login overlay becomes visible with no session', async ({ page }) => {
    await page.goto('/ats.html');
    // getSession resolves to no session → showLogin(). Generous timeout for CI.
    await expect(page.locator('#cnt-login')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Client portal auth gate', () => {
  test('client login form is present', async ({ page }) => {
    await page.goto('/client.html');
    await expect(page.locator('#client-login')).toHaveCount(1);
    await expect(page.locator('#client-email')).toHaveCount(1);
    await expect(page.locator('#client-password')).toHaveCount(1);
    await expect(page.locator('#client-login-btn')).toHaveCount(1);
  });
});

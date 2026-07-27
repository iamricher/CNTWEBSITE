const { test, expect } = require('@playwright/test');

// The two authenticated apps must always render their login gate and (for the
// ATS) the MFA overlays. These assert the gates exist in the DOM without
// depending on a live session — catching accidental deletion of the auth UI.
test.describe('ATS auth + MFA gate', () => {
  test('login form and MFA overlays are present', async ({ page }) => {
    await page.goto('/ats.html');
    await expect(page.locator('#cnt-login-form')).toHaveCount(1);
    await expect(page.locator('#cnt-email')).toHaveCount(1);
    await expect(page.locator('#cnt-pass')).toHaveCount(1);
    // MFA (roadmap #10): challenge + setup overlays and their code inputs.
    await expect(page.locator('#cnt-mfa-challenge')).toHaveCount(1);
    await expect(page.locator('#cnt-mfa-setup')).toHaveCount(1);
    await expect(page.locator('#cnt-mfa-code')).toHaveCount(1);
    await expect(page.locator('#cnt-mfa-setup-code')).toHaveCount(1);
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

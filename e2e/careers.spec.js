const { test, expect } = require('@playwright/test');

// Public application form — conditional referral fields, anti-spam, and the
// privacy consent gate. All client-side; no backend calls are triggered.
test.describe('careers.html', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/careers.html');
    // The apply form lives in the job-detail view (#view-detail), normally shown
    // after picking a job from a backend-loaded list. Reveal it directly so the
    // client-side form logic can be tested without depending on the live backend.
    await page.evaluate(() => {
      const l = document.getElementById('view-list'); if (l) l.style.display = 'none';
      const d = document.getElementById('view-detail'); if (d) d.style.display = 'block';
    });
  });

  test('referral fields are hidden until "Referral" is chosen', async ({ page }) => {
    await expect(page.locator('#referred_by')).toBeHidden();
    await expect(page.locator('#referral_relation')).toBeHidden();

    await page.selectOption('#source-select', 'Referral');
    await expect(page.locator('#referred_by')).toBeVisible();
    await expect(page.locator('#referral_relation')).toBeVisible();

    // Switching away hides and clears them again.
    await page.selectOption('#source-select', 'Website');
    await expect(page.locator('#referred_by')).toBeHidden();
  });

  test('consent checkbox is required and the RA 10173 notice is present', async ({ page }) => {
    await expect(page.locator('#consent')).toHaveAttribute('required', '');
    await expect(page.locator('.consent')).toContainText('RA 10173');
  });

  test('honeypot field exists and is positioned off-screen', async ({ page }) => {
    const hp = page.locator('input[name="company_website"]');
    await expect(hp).toHaveCount(1);
    const box = await hp.boundingBox();
    expect(box.x).toBeLessThan(0); // off-screen (left:-9999px), not display:none
  });
});

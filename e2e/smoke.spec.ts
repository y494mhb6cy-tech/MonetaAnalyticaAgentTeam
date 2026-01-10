import { test, expect } from '@playwright/test';

/**
 * Minimal E2E Smoke Test
 *
 * This test verifies the critical navigation flow works without console errors:
 * home -> map -> open/close panel -> personnel -> verify no uncaught errors
 */

test.describe('Navigation Smoke Test', () => {
  test('should navigate through main routes without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // 1. Navigate to home (skip intro if shown)
    await page.goto('/');

    // Wait for either the intro or home page to load
    await page.waitForLoadState('networkidle');

    // Skip intro if present
    const skipButton = page.locator('text=Skip intro');
    if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForURL('**/home');
    }

    // Verify we're on home
    await expect(page).toHaveURL(/\/(home)?$/);

    // 2. Navigate to Map
    await page.click('a[href="/map"]');
    await page.waitForURL('**/map');
    await expect(page).toHaveURL('/map');

    // Wait for map to render
    await page.waitForTimeout(1000);

    // 3. Open AI Preview panel
    const aiButton = page.locator('button:has-text("AI Preview")');
    if (await aiButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await aiButton.click();

      // Verify panel opened
      await expect(page.locator('text=MAOS embedded assistant')).toBeVisible();

      // Close panel with ESC
      await page.keyboard.press('Escape');

      // Verify panel closed
      await expect(page.locator('text=MAOS embedded assistant')).not.toBeVisible();
    }

    // 4. Navigate to Personnel
    await page.click('a[href="/personnel"]');
    await page.waitForURL('**/personnel');
    await expect(page).toHaveURL('/personnel');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // 5. Verify no critical console errors
    // Filter out known benign warnings (Next.js hydration, etc.)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('hydrat') &&
        !error.includes('Warning:') &&
        !error.includes('DevTools')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should render mobile viewport correctly', async ({ page }) => {
    // Set iPhone viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // Allow 5px tolerance

    // Verify mobile bottom nav is visible
    const mobileNav = page.locator('[class*="fixed bottom-0"]');
    await expect(mobileNav).toBeVisible();
  });
});

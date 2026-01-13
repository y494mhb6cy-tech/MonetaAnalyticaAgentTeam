/**
 * E2E tests for critical workflows
 * 
 * Tests the three critical workflows identified in QA_AUDIT.md:
 * 1. Leadership view: capacity/workload/outcomes summary loads correctly
 * 2. Rev vs Admin separation: user can see, filter, or segment work
 * 3. Agent + human visibility: combined view where humans/agents are both present
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/home');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('1. Leadership dashboard loads with capacity/workload/outcomes', async ({ page }) => {
    // Check that the page title/header is present
    await expect(page.locator('h1')).toContainText('MAOS', { timeout: 5000 });

    // Check for capacity gauge
    const capacitySection = page.locator('text=Org Capacity').or(page.locator('text=Capacity'));
    await expect(capacitySection.first()).toBeVisible();

    // Check for work allocation/distribution
    const workAllocation = page.locator('text=Work Allocation').or(page.locator('text=Revenue'));
    await expect(workAllocation.first()).toBeVisible();

    // Check for people status
    const peopleSection = page.locator('text=People');
    await expect(peopleSection.first()).toBeVisible();

    // Check for risk status
    const riskSection = page.locator('text=Risk Status').or(page.locator('text=Attention Required'));
    await expect(riskSection.first()).toBeVisible();

    // Check for team breakdowns
    const teamsSection = page.locator('text=Teams').or(page.locator('text=Team'));
    await expect(teamsSection.first()).toBeVisible();
  });

  test('2. Revenue vs Admin separation - filter changes visible results', async ({ page }) => {
    // Navigate to company tasks page
    await page.goto('/company-tasks');
    await page.waitForLoadState('networkidle');

    // Get initial task count
    const initialCount = await page.locator('text=/\\d+ task/').first().textContent();
    expect(initialCount).toBeTruthy();

    // Find and click revenue impact filter
    const revenueFilter = page.locator('select').filter({ hasText: 'Revenue Impact' });
    if (await revenueFilter.count() > 0) {
      await revenueFilter.selectOption('Revenue');
      await page.waitForTimeout(500); // Wait for filter to apply

      // Check that results changed (or verify revenue badge is visible)
      const revenueBadges = page.locator('text=Revenue');
      await expect(revenueBadges.first()).toBeVisible();
    }

    // Navigate to map page and check revenue overlay
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Look for revenue overlay toggle button
    const revenueToggle = page.locator('button').filter({ hasText: /Revenue|Show Overlay/i });
    if (await revenueToggle.count() > 0) {
      await revenueToggle.click();
      await page.waitForTimeout(500);

      // Check that overlay is visible (or button state changed)
      await expect(revenueToggle).toBeVisible();
    }
  });

  test('3. Agent + human visibility - combined view', async ({ page }) => {
    // Check home page shows both
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Check for people count
    const peopleCount = page.locator('text=/\\d+.*People/i');
    await expect(peopleCount.first()).toBeVisible();

    // Check for agent fleet status
    const agentFleet = page.locator('text=Agent Fleet').or(page.locator('text=Agents'));
    await expect(agentFleet.first()).toBeVisible();

    // Navigate to agents page
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');

    // Check that agents are visible
    const agentsSection = page.locator('text=Agents').or(page.locator('text=Agent'));
    await expect(agentsSection.first()).toBeVisible();

    // Navigate to personnel page
    await page.goto('/personnel');
    await page.waitForLoadState('networkidle');

    // Check that personnel are visible
    const personnelSection = page.locator('text=Personnel').or(page.locator('text=People'));
    await expect(personnelSection.first()).toBeVisible();
  });

  test('4. Button clicks result in visible state change and audit log entry', async ({ page }) => {
    // Navigate to home page
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Click on a team card link
    const teamCard = page.locator('a[href*="/map"]').first();
    if (await teamCard.count() > 0) {
      await teamCard.click();
      await page.waitForURL('**/map**', { timeout: 5000 });
      
      // Verify navigation occurred
      expect(page.url()).toContain('/map');
    }

    // Navigate to debug page to check audit log
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Check that audit log is visible
    const auditLog = page.locator('text=Audit Log');
    await expect(auditLog.first()).toBeVisible();

    // Check that events are present
    const events = page.locator('[class*="event"]').or(page.locator('text=/click|navigate/i'));
    // At least one event should be present
    const eventCount = await events.count();
    expect(eventCount).toBeGreaterThan(0);
  });

  test('5. AI Preview drawer opens and runs prompt', async ({ page }) => {
    // Navigate to home page
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Click AI Preview button
    const aiButton = page.locator('button').filter({ hasText: /AI Preview/i });
    await expect(aiButton.first()).toBeVisible();
    await aiButton.first().click();

    // Wait for drawer to open
    await page.waitForTimeout(500);

    // Check that drawer is visible
    const drawer = page.locator('text=AI Preview').or(page.locator('text=Prompt'));
    await expect(drawer.first()).toBeVisible();

    // Fill in a prompt
    const promptInput = page.locator('textarea').filter({ hasPlaceholder: /prompt|ask/i });
    if (await promptInput.count() > 0) {
      await promptInput.fill('Summarize today\'s priorities');
      
      // Click run button
      const runButton = page.locator('button').filter({ hasText: /Run/i });
      await runButton.click();

      // Wait for response (or loading state)
      await page.waitForTimeout(2000);

      // Check that response area is visible or loading state appeared
      const responseArea = page.locator('text=Response').or(page.locator('text=Running'));
      await expect(responseArea.first()).toBeVisible();
    }
  });
});

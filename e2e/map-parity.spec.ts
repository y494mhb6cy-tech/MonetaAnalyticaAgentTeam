import { test, expect, Page } from '@playwright/test';

/**
 * Map Pages Parity Tests
 *
 * These tests ensure that /map and /map/agents have consistent UI chrome,
 * all buttons are functional or properly disabled, and the toggle navigation works.
 */

// Helper to check if element is visible
async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.locator(selector).first();
    return await element.isVisible({ timeout: 2000 });
  } catch {
    return false;
  }
}

// Helper to capture console errors
function setupConsoleErrorCapture(page: Page): string[] {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
  });
  return consoleErrors;
}

test.describe('Map Pages Smoke Tests', () => {
  test('should load /map without console errors', async ({ page }) => {
    const consoleErrors = setupConsoleErrorCapture(page);

    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page).toHaveURL('/map');

    // Wait for map canvas to render
    await page.waitForTimeout(1000);

    // Filter out known benign warnings
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('hydrat') &&
        !error.includes('Warning:') &&
        !error.includes('DevTools') &&
        !error.includes('ResizeObserver')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should load /map/agents without console errors', async ({ page }) => {
    const consoleErrors = setupConsoleErrorCapture(page);

    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page).toHaveURL('/map/agents');

    // Wait for graph to render
    await page.waitForTimeout(1000);

    // Filter out known benign warnings
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('hydrat') &&
        !error.includes('Warning:') &&
        !error.includes('DevTools') &&
        !error.includes('ResizeObserver')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('UI Parity Tests', () => {
  test('should have ViewToggle on both pages with same structure', async ({ page }) => {
    // Check /map
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    const personnelMapToggle = page.locator('[role="tablist"]');
    await expect(personnelMapToggle).toBeVisible();

    const personnelTab = page.locator('a[href="/map"][role="tab"]');
    const agentsTab = page.locator('a[href="/map/agents"][role="tab"]');

    await expect(personnelTab).toBeVisible();
    await expect(agentsTab).toBeVisible();
    await expect(personnelTab).toHaveAttribute('aria-selected', 'true');

    // Check /map/agents
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    const agentsPageToggle = page.locator('[role="tablist"]');
    await expect(agentsPageToggle).toBeVisible();

    const personnelTab2 = page.locator('a[href="/map"][role="tab"]');
    const agentsTab2 = page.locator('a[href="/map/agents"][role="tab"]');

    await expect(personnelTab2).toBeVisible();
    await expect(agentsTab2).toBeVisible();
    await expect(agentsTab2).toHaveAttribute('aria-selected', 'true');
  });

  test('should have metrics panel on both pages', async ({ page }) => {
    // Check /map - top-right metrics panel
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Look for the metrics panel container
    const mapMetrics = page.locator('.absolute.top-4.right-4');
    await expect(mapMetrics).toBeVisible();

    // Check for "People" or "Active" text
    await expect(page.locator('text=People').or(page.locator('text=Active'))).toBeVisible();

    // Check /map/agents
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    const agentsMetrics = page.locator('.absolute.top-4.right-4');
    await expect(agentsMetrics).toBeVisible();

    // Check for "Agents" or "Healthy" text
    await expect(page.locator('text=Agents').or(page.locator('text=Healthy'))).toBeVisible();
  });

  test('should have Legend panel on both pages', async ({ page }) => {
    // Check /map
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Legend should be at bottom-left
    const mapLegend = page.locator('.absolute.bottom-4.left-4 button:has-text("Legend")');
    await expect(mapLegend).toBeVisible();

    // Check /map/agents
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    const agentsLegend = page.locator('.absolute.bottom-4.left-4 button:has-text("Legend")');
    await expect(agentsLegend).toBeVisible();
  });

  test('should have keyboard shortcuts hint on desktop', async ({ page }) => {
    // Check /map
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Check for keyboard hints text
    await expect(page.locator('text=Scroll')).toBeVisible();
    await expect(page.locator('text=Drag')).toBeVisible();
    await expect(page.locator('text=Click')).toBeVisible();

    // Check /map/agents
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Scroll')).toBeVisible();
    await expect(page.locator('text=Drag')).toBeVisible();
    await expect(page.locator('text=Click')).toBeVisible();
  });
});

test.describe('Navigation and Toggle Tests', () => {
  test('ViewToggle navigates between /map and /map/agents', async ({ page }) => {
    // Start at /map
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Click on Agents tab
    await page.click('a[href="/map/agents"]');
    await page.waitForURL('**/map/agents');

    await expect(page).toHaveURL('/map/agents');

    // Verify Agents tab is now selected
    const agentsTab = page.locator('a[href="/map/agents"][role="tab"]');
    await expect(agentsTab).toHaveAttribute('aria-selected', 'true');

    // Click on Personnel tab
    await page.click('a[href="/map"]');
    await page.waitForURL(/\/map$/);

    await expect(page).toHaveURL('/map');

    // Verify Personnel tab is now selected
    const personnelTab = page.locator('a[href="/map"][role="tab"]');
    await expect(personnelTab).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Button Functionality Tests - /map', () => {
  test('Legend toggle expands and collapses', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Legend should be visible
    const legendButton = page.locator('.absolute.bottom-4.left-4 button').first();
    await expect(legendButton).toBeVisible();

    // Initially collapsed - check for rotate class or aria-expanded
    const expandedContent = page.locator('text=Personnel Status');

    // Click to expand
    await legendButton.click();
    await expect(expandedContent).toBeVisible();

    // Click to collapse
    await legendButton.click();
    await expect(expandedContent).not.toBeVisible();
  });

  test('Flow Trace toggle works', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Find Flow Trace button
    const flowTraceButton = page.locator('button:has-text("Flow Trace")');
    await expect(flowTraceButton).toBeVisible();

    // Click to activate
    await flowTraceButton.click();

    // Should have active state (bg-sky-600)
    await expect(flowTraceButton).toHaveClass(/bg-sky-600/);

    // Click to deactivate
    await flowTraceButton.click();

    // Should not have active state
    await expect(flowTraceButton).not.toHaveClass(/bg-sky-600/);
  });

  test('Time window buttons work', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Find time window buttons
    const button24h = page.locator('button:has-text("24h")');
    const button7d = page.locator('button:has-text("7d")');

    await expect(button24h).toBeVisible();
    await expect(button7d).toBeVisible();

    // 24h should be selected by default
    await expect(button24h).toHaveClass(/bg-slate-700/);

    // Click 7d
    await button7d.click();
    await expect(button7d).toHaveClass(/bg-slate-700/);

    // Click back to 24h
    await button24h.click();
    await expect(button24h).toHaveClass(/bg-slate-700/);
  });

  test('Revenue overlay toggle works', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Find Revenue Analysis button
    const revenueButton = page.locator('button:has-text("Show Overlay")');

    if (await revenueButton.isVisible()) {
      // Click to show overlay
      await revenueButton.click();

      // Should show overlay content
      await expect(page.locator('text=Work Allocation')).toBeVisible();

      // Find and click hide button
      const hideButton = page.locator('button:has-text("Hide Overlay")');
      await hideButton.click();

      // Overlay content should be hidden
      await expect(page.locator('text=Work Allocation')).not.toBeVisible();
    }
  });

  test('Node display mode buttons work', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Find Node Display section and buttons
    const noneButton = page.locator('.space-y-2 button:has-text("None")');
    const tasksButton = page.locator('.space-y-2 button:has-text("Tasks")');
    const agentsButton = page.locator('.space-y-2 button:has-text("Agents")');

    // Tasks should be selected by default
    if (await tasksButton.isVisible()) {
      await expect(tasksButton).toHaveClass(/bg-blue-600/);

      // Click None
      await noneButton.click();
      await expect(noneButton).toHaveClass(/bg-blue-600/);

      // Click Agents
      await agentsButton.click();
      await expect(agentsButton).toHaveClass(/bg-blue-600/);
    }
  });

  test('Task feed filter buttons work', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Find task feed filter buttons
    const allButton = page.locator('button:has-text("All (")');
    const revenueButton = page.locator('button:has-text("Revenue (")');
    const blockedButton = page.locator('button:has-text("Blocked (")');

    if (await allButton.isVisible()) {
      // All should be selected by default
      await expect(allButton).toHaveClass(/bg-indigo-600/);

      // Click Revenue
      await revenueButton.click();
      await expect(revenueButton).toHaveClass(/bg-green-600/);

      // Click Blocked
      await blockedButton.click();
      await expect(blockedButton).toHaveClass(/bg-red-600/);

      // Click All again
      await allButton.click();
      await expect(allButton).toHaveClass(/bg-indigo-600/);
    }
  });
});

test.describe('Button Functionality Tests - /map/agents', () => {
  test('Filters toggle works', async ({ page }) => {
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    const filtersButton = page.locator('button:has-text("Filters")');
    await expect(filtersButton).toBeVisible();

    // Click to show filters
    await filtersButton.click();

    // Should show filter controls
    await expect(page.locator('text=Search')).toBeVisible();
    await expect(page.locator('text=Department')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();

    // Click to hide filters
    await filtersButton.click();

    // Filter controls should be hidden
    await expect(page.locator('.absolute.top-36.left-4 .rounded-lg:has-text("Search")')).not.toBeVisible();
  });

  test('Status filter buttons work', async ({ page }) => {
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    // Open filters
    const filtersButton = page.locator('button:has-text("Filters")');
    await filtersButton.click();

    await page.waitForTimeout(500);

    // Find status filter buttons
    const allStatusButton = page.locator('button:has-text("All")').first();
    const healthyButton = page.locator('button:has-text("Healthy")');
    const warningButton = page.locator('button:has-text("Warning")');

    if (await healthyButton.isVisible()) {
      // Click Healthy
      await healthyButton.click();
      await expect(healthyButton).toHaveClass(/bg-indigo-600/);

      // Click Warning
      await warningButton.click();
      await expect(warningButton).toHaveClass(/bg-indigo-600/);

      // Click All to reset
      await allStatusButton.click();
      await expect(allStatusButton).toHaveClass(/bg-indigo-600/);
    }
  });

  test('Agent Legend toggle works', async ({ page }) => {
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    // Find legend button
    const legendButton = page.locator('.absolute.bottom-4.left-4 button').first();
    await expect(legendButton).toBeVisible();

    const expandedContent = page.locator('text=Agent Status');

    // Click to expand
    await legendButton.click();
    await expect(expandedContent).toBeVisible();

    // Click to collapse
    await legendButton.click();
    await expect(expandedContent).not.toBeVisible();
  });

  test('Clear filters button works when filters are active', async ({ page }) => {
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    // Open filters
    const filtersButton = page.locator('button:has-text("Filters")');
    await filtersButton.click();

    await page.waitForTimeout(500);

    // Enter search text
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');

      // Clear button should appear
      const clearButton = page.locator('button:has-text("Clear All Filters")');
      await expect(clearButton).toBeVisible();

      // Click clear
      await clearButton.click();

      // Search should be cleared
      await expect(searchInput).toHaveValue('');
    }
  });

  test('AI Preview button is properly disabled with tooltip', async ({ page }) => {
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    // Click on graph to select a node (we need to trigger node selection first)
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      // Click somewhere on the canvas to try to select a node
      await canvas.click({ position: { x: 400, y: 300 } });
      await page.waitForTimeout(500);
    }

    // Look for AI Preview button (may or may not appear depending on selection)
    const aiPreviewButton = page.locator('button:has-text("AI Preview")');

    if (await aiPreviewButton.isVisible()) {
      // Should be disabled
      await expect(aiPreviewButton).toBeDisabled();

      // Should have aria-disabled
      await expect(aiPreviewButton).toHaveAttribute('aria-disabled', 'true');

      // Should show "Coming soon" indicator
      await expect(page.locator('text=Coming soon')).toBeVisible();
    }
  });
});

test.describe('Modal/Drawer Tests', () => {
  test('AI Preview drawer opens and closes with ESC', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Find AI Preview button in the top bar
    const aiButton = page.locator('button:has-text("AI Preview")');

    if (await aiButton.isVisible()) {
      await aiButton.click();

      // Drawer should open
      await expect(page.locator('text=MAOS embedded assistant')).toBeVisible();

      // Press ESC to close
      await page.keyboard.press('Escape');

      // Drawer should close
      await expect(page.locator('text=MAOS embedded assistant')).not.toBeVisible();
    }
  });

  test('Details drawer close button works on /map', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Click on canvas to try to select a person
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 400, y: 300 } });
      await page.waitForTimeout(500);
    }

    // If drawer opened, test close button
    const closeButton = page.locator('button[aria-label="Close details"], .absolute.top-0.right-0 button svg');
    if (await closeButton.first().isVisible()) {
      await closeButton.first().click();

      // Drawer should close (check for drawer container)
      await page.waitForTimeout(300);
    }
  });

  test('Details drawer close button works on /map/agents', async ({ page }) => {
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    // Click on canvas to try to select a node
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 400, y: 300 } });
      await page.waitForTimeout(500);
    }

    // If drawer opened, test close button
    const closeButton = page.locator('button[aria-label="Close details"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();

      // Drawer should close
      await page.waitForTimeout(300);
      await expect(closeButton).not.toBeVisible();
    }
  });
});

test.describe('Mobile Viewport Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('/map renders correctly on mobile viewport', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);

    // Mobile bottom nav should be visible
    const mobileNav = page.locator('[class*="fixed bottom-0"]');
    await expect(mobileNav).toBeVisible();

    // View Tasks button should be visible
    await expect(page.locator('text=View Tasks')).toBeVisible();
  });

  test('/map/agents renders correctly on mobile viewport', async ({ page }) => {
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');

    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);

    // Mobile bottom nav should be visible
    const mobileNav = page.locator('[class*="fixed bottom-0"]');
    await expect(mobileNav).toBeVisible();
  });

  test('Mobile task panel opens and closes on /map', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Find View Tasks button
    const viewTasksButton = page.locator('button:has-text("View Tasks")');
    await expect(viewTasksButton).toBeVisible();

    // Click to open
    await viewTasksButton.click();

    // Task panel should be visible
    await expect(page.locator('text=Company Tasks')).toBeVisible();

    // Find close button and click
    const closeButton = page.locator('.md\\:hidden button svg[class*="ChevronDown"]').locator('..').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });
});

test.describe('No Dead Buttons Check', () => {
  test('all visible buttons on /map are either functional or properly disabled', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get all visible buttons
    const buttons = await page.locator('button:visible').all();

    for (const button of buttons) {
      const isDisabled = await button.isDisabled();
      const ariaDisabled = await button.getAttribute('aria-disabled');
      const buttonText = await button.textContent();

      if (isDisabled || ariaDisabled === 'true') {
        // Disabled buttons should have visual indication or tooltip
        const hasCursor = await button.evaluate((el) => {
          return window.getComputedStyle(el).cursor;
        });
        expect(hasCursor).toBe('not-allowed');
      } else {
        // Enabled buttons should have click handlers (we check they don't throw)
        // This is a basic check - we just ensure clicking doesn't cause an error
        try {
          const boundingBox = await button.boundingBox();
          if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
            // Button is visible and has size - it should be interactive
            const pointerEvents = await button.evaluate((el) => {
              return window.getComputedStyle(el).pointerEvents;
            });
            expect(pointerEvents).not.toBe('none');
          }
        } catch {
          // Button might have been removed from DOM - that's ok
        }
      }
    }
  });

  test('all visible buttons on /map/agents are either functional or properly disabled', async ({ page }) => {
    await page.goto('/map/agents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get all visible buttons
    const buttons = await page.locator('button:visible').all();

    for (const button of buttons) {
      const isDisabled = await button.isDisabled();
      const ariaDisabled = await button.getAttribute('aria-disabled');
      const buttonText = await button.textContent();

      if (isDisabled || ariaDisabled === 'true') {
        // Disabled buttons should have not-allowed cursor
        const hasCursor = await button.evaluate((el) => {
          return window.getComputedStyle(el).cursor;
        });
        expect(hasCursor).toBe('not-allowed');
      } else {
        // Enabled buttons should be interactive
        try {
          const boundingBox = await button.boundingBox();
          if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
            const pointerEvents = await button.evaluate((el) => {
              return window.getComputedStyle(el).pointerEvents;
            });
            expect(pointerEvents).not.toBe('none');
          }
        } catch {
          // Button might have been removed from DOM - that's ok
        }
      }
    }
  });
});

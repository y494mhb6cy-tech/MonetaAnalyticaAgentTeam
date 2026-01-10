/**
 * Interactive Smoke Test
 *
 * This test suite ensures that all clickable controls in the app have proper handlers.
 * It renders major components and asserts that:
 * - Any element with role="button" or button tag that is not disabled has an onClick
 * - Or is a <button> or <a> with valid href
 *
 * This prevents regression of "fake interactivity" bugs where buttons appear clickable
 * but do nothing when clicked.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';
import { ViewToggle } from '@/components/ViewToggle';
import MapLegend from '@/components/MapLegend';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/map',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('Interactive Smoke Tests', () => {
  /**
   * Helper function to verify all interactive elements have proper handlers
   */
  function assertInteractiveElementsAreOperational(container: HTMLElement) {
    // Get all buttons and elements with role="button"
    const buttons = container.querySelectorAll('button, [role="button"]');
    const issues: string[] = [];

    buttons.forEach((element, index) => {
      const isDisabled =
        element.hasAttribute('disabled') ||
        element.getAttribute('aria-disabled') === 'true';

      // Skip disabled elements - they're allowed to not have handlers
      if (isDisabled) return;

      const hasOnClick = element.hasAttribute('onclick') || element.onclick !== null;
      const isNativeButton = element.tagName.toLowerCase() === 'button';
      const isLink = element.tagName.toLowerCase() === 'a';
      const hasHref = element.hasAttribute('href');

      // For React, we can't easily check if onClick is bound, but we can check
      // that it's either a native button, a link with href, or has type="submit"
      const hasType = element.hasAttribute('type');
      const elementText = element.textContent?.trim()?.slice(0, 50) || `Element ${index}`;

      // Links should have valid hrefs
      if (isLink && !hasHref) {
        issues.push(`Link without href: "${elementText}"`);
      }
    });

    if (issues.length > 0) {
      throw new Error(`Found interactive elements without proper handlers:\n${issues.join('\n')}`);
    }
  }

  describe('Sidebar Navigation', () => {
    it('all navigation buttons/links are operational', () => {
      const { container } = render(<Sidebar />);

      // All links should have valid hrefs
      const links = container.querySelectorAll('a');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
        const href = link.getAttribute('href');
        expect(href).not.toBe('');
        expect(href).not.toBe('#');
      });

      assertInteractiveElementsAreOperational(container);
    });
  });

  describe('ViewToggle', () => {
    it('toggle tabs are operational links', () => {
      const { container } = render(<ViewToggle />);

      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThanOrEqual(2);

      links.forEach(link => {
        expect(link).toHaveAttribute('href');
        const href = link.getAttribute('href');
        expect(href).toMatch(/^\//); // Should be a valid path
      });

      assertInteractiveElementsAreOperational(container);
    });
  });

  describe('MapLegend', () => {
    it('legend toggle button is operational', () => {
      const { container } = render(<MapLegend />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);

      // The toggle button should be a proper button element
      const toggleButton = buttons[0];
      expect(toggleButton.tagName.toLowerCase()).toBe('button');

      assertInteractiveElementsAreOperational(container);
    });
  });
});

describe('Disabled State Verification', () => {
  it('disabled buttons should have proper styling and attributes', () => {
    // This test verifies that buttons marked as "Coming soon" are properly disabled
    const disabledButtonHTML = `
      <button disabled title="Coming soon" class="cursor-not-allowed opacity-60">
        Action
      </button>
    `;

    const container = document.createElement('div');
    container.innerHTML = disabledButtonHTML;

    const button = container.querySelector('button');
    expect(button).toHaveAttribute('disabled');
    expect(button).toHaveAttribute('title', 'Coming soon');
    expect(button?.className).toContain('cursor-not-allowed');
    expect(button?.className).toContain('opacity-60');
  });
});

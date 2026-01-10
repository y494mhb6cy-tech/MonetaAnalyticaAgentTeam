import React from 'react';
import { render, screen } from '@testing-library/react';
import { ViewToggle } from '@/components/ViewToggle';

// Override mock for specific tests
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';

describe('ViewToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both Personnel and Agents tabs', () => {
    (usePathname as jest.Mock).mockReturnValue('/map');

    render(<ViewToggle />);

    expect(screen.getByRole('tab', { name: /personnel/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /agents/i })).toBeInTheDocument();
  });

  it('shows Personnel as selected when on /map', () => {
    (usePathname as jest.Mock).mockReturnValue('/map');

    render(<ViewToggle />);

    const personnelTab = screen.getByRole('tab', { name: /personnel/i });
    expect(personnelTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows Agents as selected when on /map/agents', () => {
    (usePathname as jest.Mock).mockReturnValue('/map/agents');

    render(<ViewToggle />);

    const agentsTab = screen.getByRole('tab', { name: /agents/i });
    expect(agentsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('has proper accessibility attributes', () => {
    (usePathname as jest.Mock).mockReturnValue('/map');

    render(<ViewToggle />);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'View mode toggle');
  });

  it('links to correct routes', () => {
    (usePathname as jest.Mock).mockReturnValue('/map');

    render(<ViewToggle />);

    const personnelLink = screen.getByRole('tab', { name: /personnel/i });
    const agentsLink = screen.getByRole('tab', { name: /agents/i });

    expect(personnelLink).toHaveAttribute('href', '/map');
    expect(agentsLink).toHaveAttribute('href', '/map/agents');
  });
});

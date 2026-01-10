import React from 'react';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/home',
}));

describe('Sidebar', () => {
  it('renders navigation links', () => {
    render(<Sidebar />);

    // Check that all navigation links are present
    expect(screen.getByTitle('Home')).toBeInTheDocument();
    expect(screen.getByTitle('Map')).toBeInTheDocument();
    expect(screen.getByTitle('Company Tasks')).toBeInTheDocument();
    expect(screen.getByTitle('Personnel')).toBeInTheDocument();
    expect(screen.getByTitle('Agents')).toBeInTheDocument();
    expect(screen.getByTitle('Tasks')).toBeInTheDocument();
    expect(screen.getByTitle('Builder')).toBeInTheDocument();
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
  });

  it('all navigation links have href attributes', () => {
    render(<Sidebar />);

    const links = screen.getAllByRole('link');

    // All links should have valid href attributes
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
      const href = link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
      expect(href).toMatch(/^\//); // Should start with /
    });
  });

  it('highlights the active link based on pathname', () => {
    render(<Sidebar />);

    const homeLink = screen.getByTitle('Home');
    // Active link should have the selection background class
    expect(homeLink).toHaveClass('bg-[var(--selection)]');
  });

  it('renders the MAOS logo badge', () => {
    render(<Sidebar />);

    expect(screen.getByText('MA')).toBeInTheDocument();
    expect(screen.getByText('MAOS')).toBeInTheDocument();
  });
});

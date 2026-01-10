import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MaosIntro from '@/components/MaosIntro';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('MaosIntro Modal', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the modal with proper accessibility attributes', () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'maos-intro-title');
  });

  it('shows the close button after 2 seconds', async () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    // Close button should not be visible initially
    expect(screen.queryByLabelText(/close intro/i)).not.toBeInTheDocument();

    // Advance timers by 2 seconds and flush updates
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // Close button should now be visible
    expect(screen.getByLabelText(/close intro/i)).toBeInTheDocument();
  });

  it('calls onComplete when close button is clicked', async () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    // Show skip button
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    const closeButton = screen.getByLabelText(/close intro/i);
    fireEvent.click(closeButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Skip intro is clicked', async () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    // Show skip button
    await act(async () => {
      jest.advanceTimersByTime(2100);
    });

    // The skip button has text "Skip intro →" - search for it
    const skipButton = screen.getByText(/skip intro/i);
    fireEvent.click(skipButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Enter MAOS button is clicked', async () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    // Advance to stage 4 when CTA button appears
    await act(async () => {
      jest.advanceTimersByTime(7000);
    });

    // Get the CTA button specifically (not the close button which also has "enter MAOS" in aria-label)
    const buttons = screen.getAllByRole('button', { name: /enter maos/i });
    // The CTA button is the one with the gradient class
    const enterButton = buttons.find(btn =>
      btn.className.includes('from-blue-500')
    );
    expect(enterButton).toBeTruthy();
    fireEvent.click(enterButton!);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when ESC key is pressed', async () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('prevents background scrolling while open', () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('displays progress indicator dots', () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    // Should have 5 progress dots - use a more robust selector
    const dialog = screen.getByRole('dialog');
    const progressDots = dialog.querySelectorAll('.rounded-full.transition-all');
    // Filter to only the small 2x2 dots (progress indicators)
    const smallDots = Array.from(progressDots).filter(el =>
      el.classList.contains('w-2') && el.classList.contains('h-2')
    );
    expect(smallDots).toHaveLength(5);
  });
});

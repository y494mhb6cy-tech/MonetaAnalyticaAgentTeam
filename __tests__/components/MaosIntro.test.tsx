import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaosIntro from '@/components/MaosIntro';

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

    // Advance timers by 2 seconds
    jest.advanceTimersByTime(2000);

    // Close button should now be visible
    expect(screen.getByLabelText(/close intro/i)).toBeInTheDocument();
  });

  it('calls onComplete when close button is clicked', async () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    // Show skip button
    jest.advanceTimersByTime(2000);

    const closeButton = screen.getByLabelText(/close intro/i);
    fireEvent.click(closeButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Skip intro is clicked', async () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    // Show skip button
    jest.advanceTimersByTime(2000);

    const skipButton = screen.getByText(/skip intro/i);
    fireEvent.click(skipButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Enter MAOS button is clicked', async () => {
    render(<MaosIntro onComplete={mockOnComplete} />);

    // Advance to stage 4 when CTA button appears
    jest.advanceTimersByTime(7000);

    const enterButton = screen.getByRole('button', { name: /enter maos/i });
    fireEvent.click(enterButton);

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

    // Should have 5 progress dots
    const progressContainer = screen.getByRole('dialog').querySelector('.absolute.bottom-8.left-1\\/2');
    expect(progressContainer?.children).toHaveLength(5);
  });
});

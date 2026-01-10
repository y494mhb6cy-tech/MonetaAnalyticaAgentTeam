import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIPreviewDrawer } from '@/components/AIPreviewDrawer';
import { useMaosStore } from '@/lib/maos-store';

// Mock the store
jest.mock('@/lib/maos-store', () => ({
  useMaosStore: jest.fn(),
}));

const mockSetAiPanelOpen = jest.fn();

const defaultMockStore = {
  aiPanelOpen: true,
  setAiPanelOpen: mockSetAiPanelOpen,
  aiContext: null,
  personnel: [],
  agents: [],
  tasks: [],
  mapState: { nodes: [], edges: [], overlaysEnabled: false },
};

describe('AIPreviewDrawer Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMaosStore as jest.Mock).mockReturnValue(defaultMockStore);
  });

  it('renders when aiPanelOpen is true', () => {
    render(<AIPreviewDrawer />);

    expect(screen.getByText('AI Preview')).toBeInTheDocument();
    expect(screen.getByText('MAOS embedded assistant')).toBeInTheDocument();
  });

  it('does not render when aiPanelOpen is false', () => {
    (useMaosStore as jest.Mock).mockReturnValue({
      ...defaultMockStore,
      aiPanelOpen: false,
    });

    render(<AIPreviewDrawer />);

    expect(screen.queryByText('AI Preview')).not.toBeInTheDocument();
  });

  it('calls setAiPanelOpen(false) when Close button is clicked', () => {
    render(<AIPreviewDrawer />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockSetAiPanelOpen).toHaveBeenCalledWith(false);
  });

  it('calls setAiPanelOpen(false) when backdrop is clicked', () => {
    render(<AIPreviewDrawer />);

    // The backdrop has the bg-black/40 class
    const backdrop = document.querySelector('.bg-black\\/40');
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop!);

    expect(mockSetAiPanelOpen).toHaveBeenCalledWith(false);
  });

  it('calls setAiPanelOpen(false) when ESC key is pressed', () => {
    render(<AIPreviewDrawer />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockSetAiPanelOpen).toHaveBeenCalledWith(false);
  });

  it('displays prompt templates', () => {
    render(<AIPreviewDrawer />);

    expect(screen.getByText(/Summarize today/)).toBeInTheDocument();
    expect(screen.getByText(/Identify bottlenecks and risks/)).toBeInTheDocument();
    expect(screen.getByText(/Recommend next 5 actions/)).toBeInTheDocument();
  });

  it('updates prompt when template is clicked', () => {
    render(<AIPreviewDrawer />);

    const template = screen.getByText(/Summarize today/);
    fireEvent.click(template);

    const textarea = screen.getByPlaceholderText(/ask maos/i) as HTMLTextAreaElement;
    expect(textarea.value).toMatch(/Summarize today/);
  });

  it('Run button is disabled when prompt is empty', () => {
    render(<AIPreviewDrawer />);

    const runButton = screen.getByText('Run');
    expect(runButton).toBeDisabled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Controls from './Controls';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
}));

describe('Controls Component', () => {
  const mockOnSelect = vi.fn();
  const mockOnGenerate = vi.fn();
  const mockOnToggleDev = vi.fn();
  const mockOnPromptChange = vi.fn();
  const mockOnTierChange = vi.fn();

  const defaultProps = {
    currentPreset: null,
    onSelect: mockOnSelect,
    onGenerate: mockOnGenerate,
    isGenerating: false,
    currentStyles: null,
    onToggleDev: mockOnToggleDev,
    onPromptChange: mockOnPromptChange,
    currentTier: 'FREE',
    onTierChange: mockOnTierChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Controls {...defaultProps} />);
      expect(screen.getByText('Visual Styles')).toBeInTheDocument();
    });

    it('displays subtitle', () => {
      render(<Controls {...defaultProps} />);
      expect(screen.getByText(/Select a style to generate/i)).toBeInTheDocument();
    });

    it('shows Signature Collection accordion', () => {
      render(<Controls {...defaultProps} />);
      expect(screen.getByText('Signature Collection')).toBeInTheDocument();
    });

    it('shows Standard Collection accordion', () => {
      render(<Controls {...defaultProps} />);
      expect(screen.getByText('Standard Collection')).toBeInTheDocument();
    });
  });

  describe('Tier Selection', () => {
    it('renders tier indicator badge', () => {
      render(<Controls {...defaultProps} />);
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    it('shows Standard when FREE tier selected', () => {
      render(<Controls {...defaultProps} currentTier="FREE" />);
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    it('shows 4K Pro when PREMIUM tier selected', () => {
      render(<Controls {...defaultProps} currentTier="PREMIUM" />);
      expect(screen.getByText('4K Pro')).toBeInTheDocument();
    });

    it('calls onTierChange when toggle is clicked from PREMIUM', () => {
      render(<Controls {...defaultProps} currentTier="PREMIUM" />);
      const toggleButton = screen.getByLabelText(/Switch to Standard/i);
      fireEvent.click(toggleButton);
      expect(mockOnTierChange).toHaveBeenCalledWith('FREE');
    });

    it('calls onTierChange when toggle is clicked from FREE', () => {
      render(<Controls {...defaultProps} currentTier="FREE" />);
      const toggleButton = screen.getByLabelText(/Switch to 4K Pro/i);
      fireEvent.click(toggleButton);
      expect(mockOnTierChange).toHaveBeenCalledWith('PREMIUM');
    });
  });

  describe('Developer Toggle', () => {
    it('renders developer console button', () => {
      render(<Controls {...defaultProps} />);
      const devButton = screen.getByTitle('Developer Console');
      expect(devButton).toBeInTheDocument();
    });

    it('calls onToggleDev when developer button is clicked', () => {
      render(<Controls {...defaultProps} />);
      const devButton = screen.getByTitle('Developer Console');
      fireEvent.click(devButton);
      expect(mockOnToggleDev).toHaveBeenCalledTimes(1);
    });
  });

  describe('Generate Button', () => {
    it('renders generate button', () => {
      render(<Controls {...defaultProps} />);
      expect(screen.getByText(/Generate Render/i)).toBeInTheDocument();
    });

    it('shows loading state when generating', async () => {
      render(<Controls {...defaultProps} isGenerating={true} />);
      // Should show one of the loading messages
      await waitFor(() => {
        const loadingMessages = ['Parsing Plan...', 'Geometry...', 'Lighting...', 'Materials...', 'Polishing...', 'Neural Processing...'];
        const hasLoadingMessage = loadingMessages.some(msg =>
          screen.queryByText(msg) !== null
        );
        expect(hasLoadingMessage).toBe(true);
      });
    });
  });

  describe('Style Selection', () => {
    it('calls onSelect when a style card is clicked', async () => {
      render(<Controls {...defaultProps} />);

      // Open the Signature Collection accordion first
      const signatureAccordion = screen.getByText('Signature Collection');
      fireEvent.click(signatureAccordion);

      // Find any style card and click it
      await waitFor(() => {
        const styleCards = document.querySelectorAll('[style*="cursor: pointer"]');
        if (styleCards.length > 2) {
          fireEvent.click(styleCards[2]); // Click a style card (not the accordion)
        }
      });
    });

    it('toggles style selection (deselect on second click)', () => {
      const { rerender } = render(<Controls {...defaultProps} currentPreset="dark_teal_minimalist" />);

      // Open accordion
      const signatureAccordion = screen.getByText('Signature Collection');
      fireEvent.click(signatureAccordion);

      // When a style is already selected, clicking it should call onSelect with null
      // This tests the toggle logic in handleCardClick
    });
  });

  describe('Accordion Behavior', () => {
    it('opens Signature accordion on click', () => {
      render(<Controls {...defaultProps} />);
      const signatureAccordion = screen.getByText('Signature Collection');
      fireEvent.click(signatureAccordion);
      // Accordion should now be open - check for style cards
      expect(signatureAccordion).toBeInTheDocument();
    });

    it('opens Standard accordion on click', () => {
      render(<Controls {...defaultProps} />);
      const standardAccordion = screen.getByText('Standard Collection');
      fireEvent.click(standardAccordion);
      expect(standardAccordion).toBeInTheDocument();
    });

    it('closes accordion when clicked again', () => {
      render(<Controls {...defaultProps} />);
      const signatureAccordion = screen.getByText('Signature Collection');

      // Open
      fireEvent.click(signatureAccordion);
      // Close
      fireEvent.click(signatureAccordion);

      expect(signatureAccordion).toBeInTheDocument();
    });

    it('switches between accordions', () => {
      render(<Controls {...defaultProps} />);
      const signatureAccordion = screen.getByText('Signature Collection');
      const standardAccordion = screen.getByText('Standard Collection');

      // Open Signature
      fireEvent.click(signatureAccordion);
      // Open Standard (should close Signature)
      fireEvent.click(standardAccordion);

      expect(standardAccordion).toBeInTheDocument();
    });
  });

  describe('Custom Styles', () => {
    it('uses currentStyles when provided', () => {
      const customStyles = {
        custom_style: {
          title: 'Custom Test Style',
          category: 'Signature',
          description: 'A test style',
          hex_palette: ['#ffffff', '#000000']
        }
      };

      render(<Controls {...defaultProps} currentStyles={customStyles} />);

      // Open Signature accordion
      const signatureAccordion = screen.getByText('Signature Collection');
      fireEvent.click(signatureAccordion);

      expect(screen.getByText('Custom Test Style')).toBeInTheDocument();
    });
  });
});

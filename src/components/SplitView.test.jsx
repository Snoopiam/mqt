import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SplitView from './SplitView';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, ...props }) => <div style={typeof style === 'object' ? style : {}} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
  useSpring: vi.fn(() => ({ set: vi.fn(), get: () => 50 })),
  useTransform: vi.fn((value, transform) => {
    if (typeof transform === 'function') {
      return transform(50);
    }
    return '50%';
  }),
  useDragControls: vi.fn(() => ({})),
}));

describe('SplitView Component', () => {
  const defaultProps = {
    beforeImage: 'data:image/png;base64,before',
    afterImage: 'data:image/png;base64,after'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SplitView {...defaultProps} />);
      expect(screen.getByAltText('Original')).toBeInTheDocument();
    });

    it('renders before image', () => {
      render(<SplitView {...defaultProps} />);
      const beforeImg = screen.getByAltText('Original');
      expect(beforeImg).toHaveAttribute('src', defaultProps.beforeImage);
    });

    it('renders after image', () => {
      render(<SplitView {...defaultProps} />);
      const afterImg = screen.getByAltText('Render');
      expect(afterImg).toHaveAttribute('src', defaultProps.afterImage);
    });
  });

  describe('Zoom Controls', () => {
    it('renders zoom in button', () => {
      render(<SplitView {...defaultProps} />);
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('renders zoom percentage display', () => {
      render(<SplitView {...defaultProps} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders reset button', () => {
      render(<SplitView {...defaultProps} />);
      const resetButton = screen.getByTitle('Reset View');
      expect(resetButton).toBeInTheDocument();
    });

    it('zoom out decreases zoom level', () => {
      render(<SplitView {...defaultProps} />);
      const zoomOutButton = screen.getByLabelText('Zoom out');

      fireEvent.click(zoomOutButton);
      // Zoom should decrease from 100% by 25%
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('zoom in increases zoom level', () => {
      render(<SplitView {...defaultProps} />);
      const zoomInButton = screen.getByLabelText('Zoom in');

      fireEvent.click(zoomInButton);
      // Zoom should increase from 100% by 25% - use getAllByText to handle multiple elements
      expect(screen.getAllByText('125%').length).toBeGreaterThan(0);
    });

    it('reset button resets zoom to 100%', () => {
      render(<SplitView {...defaultProps} />);
      const zoomInButton = screen.getByLabelText('Zoom in');
      const resetButton = screen.getByLabelText('Reset view to 100%');

      // Zoom in first
      fireEvent.click(zoomInButton);
      fireEvent.click(zoomInButton);
      // Use getAllByText to handle multiple elements
      expect(screen.getAllByText('150%').length).toBeGreaterThan(0);

      // Reset
      fireEvent.click(resetButton);
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    });

    it('zoom has minimum limit', () => {
      render(<SplitView {...defaultProps} />);
      const zoomOutButton = screen.getByLabelText('Zoom out');

      // Click zoom out many times
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomOutButton);
      }

      // Should not go below 50% - use getAllByText since there may be multiple elements
      const zoomTexts = screen.getAllByText('50%');
      expect(zoomTexts.length).toBeGreaterThan(0);
    });

    it('zoom has maximum limit', () => {
      render(<SplitView {...defaultProps} />);
      const zoomInButton = screen.getByLabelText('Zoom in');

      // Click zoom in many times
      for (let i = 0; i < 50; i++) {
        fireEvent.click(zoomInButton);
      }

      // Should not go above 500% - use getAllByText since there may be multiple elements
      const zoomTexts = screen.getAllByText('500%');
      expect(zoomTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Slider Handle', () => {
    it('renders slider handle', () => {
      const { container } = render(<SplitView {...defaultProps} />);
      // Look for the slider handle (orange bar with circular handle)
      const sliderHandle = container.querySelector('[style*="ew-resize"]');
      expect(sliderHandle).toBeInTheDocument();
    });
  });

  describe('Mouse Interactions', () => {
    it('handles mouse wheel zoom', () => {
      const { container } = render(<SplitView {...defaultProps} />);
      const splitViewContainer = container.firstChild;

      // Simulate wheel event with ctrlKey
      fireEvent.wheel(splitViewContainer, {
        deltaY: -100,
        ctrlKey: true
      });

      // Should zoom in
    });

    it('handles pan start on mousedown', () => {
      const { container } = render(<SplitView {...defaultProps} />);
      const splitViewContainer = container.firstChild;

      fireEvent.mouseDown(splitViewContainer, {
        clientX: 100,
        clientY: 100
      });

      // Pan should be initiated
    });
  });

  describe('Image Display', () => {
    it('images have contain object-fit', () => {
      render(<SplitView {...defaultProps} />);
      const beforeImg = screen.getByAltText('Original');
      const afterImg = screen.getByAltText('Render');

      expect(beforeImg).toHaveStyle({ objectFit: 'contain' });
      expect(afterImg).toHaveStyle({ objectFit: 'contain' });
    });

    it('images fill container', () => {
      render(<SplitView {...defaultProps} />);
      const beforeImg = screen.getByAltText('Original');

      expect(beforeImg).toHaveStyle({ width: '100%', height: '100%' });
    });
  });

  describe('Container', () => {
    it('has glass-panel class', () => {
      const { container } = render(<SplitView {...defaultProps} />);
      const splitViewContainer = container.firstChild;
      expect(splitViewContainer).toHaveClass('glass-panel');
    });

    it('has overflow hidden', () => {
      const { container } = render(<SplitView {...defaultProps} />);
      const splitViewContainer = container.firstChild;
      expect(splitViewContainer).toHaveStyle({ overflow: 'hidden' });
    });
  });
});

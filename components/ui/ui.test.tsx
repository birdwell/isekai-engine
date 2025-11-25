import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconButton, LoadingSpinner } from './index';

describe('IconButton', () => {
  describe('rendering', () => {
    it('renders the icon', () => {
      render(<IconButton onClick={() => {}} icon={<span data-testid="test-icon">Icon</span>} />);
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders with title attribute', () => {
      render(<IconButton onClick={() => {}} icon={<span>Icon</span>} title="Click me" />);
      
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Click me');
    });

    it('applies custom className', () => {
      render(<IconButton onClick={() => {}} icon={<span>Icon</span>} className="custom-class" />);
      
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('click behavior', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<IconButton onClick={handleClick} icon={<span>Icon</span>} />);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('stops event propagation', () => {
      const handleClick = vi.fn();
      const handleParentClick = vi.fn();
      
      render(
        <div onClick={handleParentClick}>
          <IconButton onClick={handleClick} icon={<span>Icon</span>} />
        </div>
      );
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('passes event to onClick handler', () => {
      const handleClick = vi.fn();
      render(<IconButton onClick={handleClick} icon={<span>Icon</span>} />);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('disabled state', () => {
    it('is not disabled by default', () => {
      render(<IconButton onClick={() => {}} icon={<span>Icon</span>} />);
      
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<IconButton onClick={() => {}} icon={<span>Icon</span>} disabled={true} />);
      
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled classes when disabled', () => {
      render(<IconButton onClick={() => {}} icon={<span>Icon</span>} disabled={true} />);
      
      expect(screen.getByRole('button')).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('does not call onClick when disabled and clicked', () => {
      const handleClick = vi.fn();
      render(<IconButton onClick={handleClick} icon={<span>Icon</span>} disabled={true} />);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('variant styling', () => {
    it('applies default variant classes by default', () => {
      render(<IconButton onClick={() => {}} icon={<span>Icon</span>} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-slate-200');
    });

    it('applies default variant classes when variant is default', () => {
      render(<IconButton onClick={() => {}} icon={<span>Icon</span>} variant="default" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-slate-200');
    });

    it('applies primary variant classes when variant is primary', () => {
      render(<IconButton onClick={() => {}} icon={<span>Icon</span>} variant="primary" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-white');
    });

    it('always applies base classes', () => {
      render(<IconButton onClick={() => {}} icon={<span>Icon</span>} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-2', 'rounded-full', 'border', 'transition-all', 'shadow-lg', 'backdrop-blur-sm');
    });
  });
});

describe('LoadingSpinner', () => {
  describe('message', () => {
    it('renders default message when no message prop provided', () => {
      render(<LoadingSpinner />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders custom message when provided', () => {
      render(<LoadingSpinner message="Please wait..." />);
      
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('does not show default message when custom message provided', () => {
      render(<LoadingSpinner message="Custom message" />);
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
  });

  describe('spinner element', () => {
    it('has spinner element with animation class', () => {
      const { container } = render(<LoadingSpinner />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('has spinner with rounded-full class', () => {
      const { container } = render(<LoadingSpinner />);
      
      const spinner = container.querySelector('.rounded-full.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('container styling', () => {
    it('has backdrop blur styling', () => {
      const { container } = render(<LoadingSpinner />);
      
      const backdrop = container.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('has flex centering classes', () => {
      const { container } = render(<LoadingSpinner />);
      
      const flexContainer = container.querySelector('.flex.items-center.justify-center');
      expect(flexContainer).toBeInTheDocument();
    });
  });
});

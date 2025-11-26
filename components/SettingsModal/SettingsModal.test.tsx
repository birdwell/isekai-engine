import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleSwitch } from './ToggleSwitch';
import { AutoPaintToggle } from './AutoPaintToggle';
import { QualityOption } from './QualityOption';
import { QualitySettings } from './QualitySettings';
import { SettingsModal } from './index';

const mockSetQuality = vi.fn();
const mockSetAutoPaint = vi.fn();

vi.mock('@/contexts/MediaEngineContext', () => ({
  useMediaEngineContext: vi.fn(() => ({
    quality: 'fast' as const,
    setQuality: mockSetQuality,
    autoPaint: false,
    setAutoPaint: mockSetAutoPaint,
  })),
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual<typeof import('lucide-react')>('lucide-react');
  return {
    ...actual,
    Zap: (props: any) => <span data-testid="zap-icon" {...props} />,
    Star: (props: any) => <span data-testid="star-icon" {...props} />,
    Paintbrush: (props: any) => <span data-testid="paintbrush-icon" {...props} />,
    X: (props: any) => <span data-testid="x-icon" {...props} />,
  };
});

import { useMediaEngineContext } from '@/contexts/MediaEngineContext';

describe('ToggleSwitch', () => {
  it('renders with enabled state classes', () => {
    const { container } = render(<ToggleSwitch enabled={true} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('bg-amber-600');
  });

  it('renders with disabled state classes', () => {
    const { container } = render(<ToggleSwitch enabled={false} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('bg-slate-700');
  });

  it('positions toggle knob correctly when enabled', () => {
    const { container } = render(<ToggleSwitch enabled={true} />);
    const knob = container.querySelector('.rounded-full.bg-white') as HTMLElement;
    expect(knob.className).toContain('left-6');
  });

  it('positions toggle knob correctly when disabled', () => {
    const { container } = render(<ToggleSwitch enabled={false} />);
    const knob = container.querySelector('.rounded-full.bg-white') as HTMLElement;
    expect(knob.className).toContain('left-1');
  });
});

describe('AutoPaintToggle', () => {
  it('renders enabled state text', () => {
    render(<AutoPaintToggle enabled={true} onToggle={() => {}} />);
    expect(screen.getByText('Images generate automatically every turn.')).toBeInTheDocument();
  });

  it('renders disabled state text', () => {
    render(<AutoPaintToggle enabled={false} onToggle={() => {}} />);
    expect(screen.getByText('Manual generation only.')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<AutoPaintToggle enabled={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('applies enabled styling when enabled', () => {
    render(<AutoPaintToggle enabled={true} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-amber-500');
  });

  it('applies disabled styling when disabled', () => {
    render(<AutoPaintToggle enabled={false} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-slate-700');
  });
});

describe('QualityOption', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockIcon = (({ className }: { className?: string }) => <span data-testid="mock-icon" className={className} />) as any;

  it('renders title and description', () => {
    render(
      <QualityOption
        icon={MockIcon}
        title="Test Title"
        description="Test Description"
        selected={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('applies selected styling when selected', () => {
    render(
      <QualityOption
        icon={MockIcon}
        title="Test"
        description="Desc"
        selected={true}
        onClick={() => {}}
      />
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-amber-500');
  });

  it('applies unselected styling when not selected', () => {
    render(
      <QualityOption
        icon={MockIcon}
        title="Test"
        description="Desc"
        selected={false}
        onClick={() => {}}
      />
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-slate-700');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <QualityOption
        icon={MockIcon}
        title="Test"
        description="Desc"
        selected={false}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('QualitySettings', () => {
  it('renders both quality options', () => {
    render(<QualitySettings quality="fast" onSelect={() => {}} />);
    expect(screen.getByText('Flash Speed (Default)')).toBeInTheDocument();
    expect(screen.getByText('Pro Quality')).toBeInTheDocument();
  });

  it('shows fast option as selected when quality is fast', () => {
    render(<QualitySettings quality="fast" onSelect={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0].className).toContain('border-amber-500');
    expect(buttons[1].className).toContain('border-slate-700');
  });

  it('shows quality option as selected when quality is quality', () => {
    render(<QualitySettings quality="quality" onSelect={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0].className).toContain('border-slate-700');
    expect(buttons[1].className).toContain('border-amber-500');
  });

  it('calls onSelect with fast when fast option clicked', () => {
    const onSelect = vi.fn();
    render(<QualitySettings quality="quality" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Flash Speed (Default)'));
    expect(onSelect).toHaveBeenCalledWith('fast');
  });

  it('calls onSelect with quality when quality option clicked', () => {
    const onSelect = vi.fn();
    render(<QualitySettings quality="fast" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Pro Quality'));
    expect(onSelect).toHaveBeenCalledWith('quality');
  });
});

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMediaEngineContext).mockReturnValue({
      quality: 'fast',
      setQuality: mockSetQuality,
      autoPaint: false,
      setAutoPaint: mockSetAutoPaint,
      gallery: [],
      currentIndex: 0,
      currentMedia: null,
      imageLoading: false,
      videoLoading: false,
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: vi.fn(),
      regenerateCurrent: vi.fn(),
      nextImage: vi.fn(),
      prevImage: vi.fn(),
      canPaintNew: false,
    });
  });

  it('returns null when not open', () => {
    const { container } = render(<SettingsModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal content when open', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('System Configuration')).toBeInTheDocument();
  });

  it('renders AutoPaintToggle with correct props', () => {
    vi.mocked(useMediaEngineContext).mockReturnValue({
      quality: 'fast',
      setQuality: mockSetQuality,
      autoPaint: true,
      setAutoPaint: mockSetAutoPaint,
      gallery: [],
      currentIndex: 0,
      currentMedia: null,
      imageLoading: false,
      videoLoading: false,
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: vi.fn(),
      regenerateCurrent: vi.fn(),
      nextImage: vi.fn(),
      prevImage: vi.fn(),
      canPaintNew: false,
    });
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Images generate automatically every turn.')).toBeInTheDocument();
  });

  it('renders QualitySettings with correct props', () => {
    vi.mocked(useMediaEngineContext).mockReturnValue({
      quality: 'quality',
      setQuality: mockSetQuality,
      autoPaint: false,
      setAutoPaint: mockSetAutoPaint,
      gallery: [],
      currentIndex: 0,
      currentMedia: null,
      imageLoading: false,
      videoLoading: false,
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: vi.fn(),
      regenerateCurrent: vi.fn(),
      nextImage: vi.fn(),
      prevImage: vi.fn(),
      canPaintNew: false,
    });
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const proQualityButton = buttons.find(b => b.textContent?.includes('Pro Quality'));
    expect(proQualityButton?.className).toContain('border-amber-500');
  });

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(b => b.querySelector('[data-testid="x-icon"]'));
    fireEvent.click(closeButton!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Confirm button clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls setAutoPaint when toggle clicked', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Auto-Paint Scenes'));
    expect(mockSetAutoPaint).toHaveBeenCalledWith(true);
  });

  it('calls setQuality when quality option clicked', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Pro Quality'));
    expect(mockSetQuality).toHaveBeenCalledWith('quality');
  });
});

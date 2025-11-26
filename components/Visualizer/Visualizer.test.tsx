import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ScanlineOverlay } from './ScanlineOverlay';
import { NewSceneBadge } from './NewSceneBadge';
import { EmptyState } from './EmptyState';
import { GalleryNavigation } from './GalleryNavigation';
import { MediaDisplay } from './MediaDisplay';
import { ActionButtons } from './ActionButtons';
import { Visualizer } from './index';

vi.mock('@/components/ui', () => ({
  IconButton: ({ onClick, title, icon }: any) => (
    <button onClick={onClick} title={title}>{icon}</button>
  ),
  LoadingSpinner: ({ message }: any) => <div data-testid="loading-spinner">{message}</div>
}));

vi.mock('lucide-react', () => ({
  Paintbrush: () => <span data-testid="paintbrush-icon" />,
  ImageIcon: () => <span data-testid="image-icon" />,
  ChevronLeft: () => <span data-testid="chevron-left" />,
  ChevronRight: () => <span data-testid="chevron-right" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  Clapperboard: () => <span data-testid="clapperboard-icon" />
}));

const mockGenerateImageForScene = vi.fn();
const mockRegenerateCurrent = vi.fn();
const mockNextImage = vi.fn();
const mockPrevImage = vi.fn();

vi.mock('@/contexts/MediaEngineContext', () => ({
  useMediaEngineContext: vi.fn(() => ({
    gallery: [],
    currentIndex: 0,
    currentMedia: null,
    imageLoading: false,
    videoLoading: false,
    generateImageForScene: mockGenerateImageForScene,
    regenerateCurrent: mockRegenerateCurrent,
    nextImage: mockNextImage,
    prevImage: mockPrevImage,
    canPaintNew: false,
  })),
}));

import { useMediaEngineContext } from '@/contexts/MediaEngineContext';

const createMediaItem = (overrides = {}) => ({
  id: 'test-id',
  url: 'https://example.com/image.png',
  videoUrl: null,
  prompt: 'test prompt',
  timestamp: Date.now(),
  ...overrides
});

describe('ScanlineOverlay', () => {
  it('renders overlay divs', () => {
    const { container } = render(<ScanlineOverlay />);
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBe(2);
  });
});

describe('NewSceneBadge', () => {
  it('renders "New Scene Available" text', () => {
    render(<NewSceneBadge onClick={() => {}} />);
    expect(screen.getByText('New Scene Available')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<NewSceneBadge onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState', () => {
  it('renders "No Visual Data" text', () => {
    render(<EmptyState onPaintScene={() => {}} canPaint={false} />);
    expect(screen.getByText('No Visual Data')).toBeInTheDocument();
  });

  it('button is enabled when canPaint is true', () => {
    render(<EmptyState onPaintScene={() => {}} canPaint={true} />);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(screen.getByText('Paint This Scene')).toBeInTheDocument();
  });

  it('button is disabled when canPaint is false', () => {
    render(<EmptyState onPaintScene={() => {}} canPaint={false} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Awaiting Scene Data...')).toBeInTheDocument();
  });

  it('calls onPaintScene when button is clicked', () => {
    const handlePaint = vi.fn();
    render(<EmptyState onPaintScene={handlePaint} canPaint={true} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handlePaint).toHaveBeenCalledTimes(1);
  });
});

describe('GalleryNavigation', () => {
  it('returns null when gallerySize <= 1', () => {
    const { container } = render(
      <GalleryNavigation gallerySize={1} currentIndex={0} onNext={() => {}} onPrev={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders navigation when gallerySize > 1', () => {
    render(
      <GalleryNavigation gallerySize={3} currentIndex={1} onNext={() => {}} onPrev={() => {}} />
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('shows current index / total', () => {
    render(
      <GalleryNavigation gallerySize={5} currentIndex={2} onNext={() => {}} onPrev={() => {}} />
    );
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
  });

  it('calls onPrev when prev button clicked', () => {
    const handlePrev = vi.fn();
    render(
      <GalleryNavigation gallerySize={3} currentIndex={1} onNext={() => {}} onPrev={handlePrev} />
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(handlePrev).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when next button clicked', () => {
    const handleNext = vi.fn();
    render(
      <GalleryNavigation gallerySize={3} currentIndex={1} onNext={handleNext} onPrev={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it('disables prev button at first index', () => {
    render(
      <GalleryNavigation gallerySize={3} currentIndex={0} onNext={() => {}} onPrev={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('disables next button at last index', () => {
    render(
      <GalleryNavigation gallerySize={3} currentIndex={2} onNext={() => {}} onPrev={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toBeDisabled();
  });
});

describe('MediaDisplay', () => {
  it('renders video when videoUrl is present', () => {
    const mediaItem = createMediaItem({ videoUrl: 'https://example.com/video.mp4' });
    const { container } = render(<MediaDisplay mediaItem={mediaItem} loading={false} />);
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
  });

  it('renders image when url is present and no videoUrl', () => {
    const mediaItem = createMediaItem({ videoUrl: null });
    render(<MediaDisplay mediaItem={mediaItem} loading={false} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.png');
  });

  it('returns null when neither url nor videoUrl present', () => {
    const mediaItem = createMediaItem({ url: '', videoUrl: null });
    const { container } = render(<MediaDisplay mediaItem={mediaItem} loading={false} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('ActionButtons', () => {
  it('returns null when hasVideo is true', () => {
    const { container } = render(
      <ActionButtons hasVideo={true} onRegenerate={() => {}} onGenerateVideo={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders buttons when hasVideo is false', () => {
    render(
      <ActionButtons hasVideo={false} onRegenerate={() => {}} onGenerateVideo={() => {}} />
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('calls onRegenerate when regenerate button clicked', () => {
    const handleRegenerate = vi.fn();
    render(
      <ActionButtons hasVideo={false} onRegenerate={handleRegenerate} onGenerateVideo={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(handleRegenerate).toHaveBeenCalledTimes(1);
  });

  it('calls onGenerateVideo when video button clicked', () => {
    const handleGenerateVideo = vi.fn();
    render(
      <ActionButtons hasVideo={false} onRegenerate={() => {}} onGenerateVideo={handleGenerateVideo} />
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(handleGenerateVideo).toHaveBeenCalledTimes(1);
  });
});

describe('Visualizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMediaEngineContext).mockReturnValue({
      gallery: [],
      currentIndex: 0,
      currentMedia: null,
      imageLoading: false,
      videoLoading: false,
      autoPaint: false,
      quality: 'fast',
      setAutoPaint: vi.fn(),
      setQuality: vi.fn(),
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: mockGenerateImageForScene,
      regenerateCurrent: mockRegenerateCurrent,
      nextImage: mockNextImage,
      prevImage: mockPrevImage,
      canPaintNew: false,
    });
  });

  it('shows loading state when loading is true', () => {
    vi.mocked(useMediaEngineContext).mockReturnValue({
      gallery: [],
      currentIndex: 0,
      currentMedia: null,
      imageLoading: true,
      videoLoading: false,
      autoPaint: false,
      quality: 'fast',
      setAutoPaint: vi.fn(),
      setQuality: vi.fn(),
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: mockGenerateImageForScene,
      regenerateCurrent: mockRegenerateCurrent,
      nextImage: mockNextImage,
      prevImage: mockPrevImage,
      canPaintNew: false,
    });
    render(<Visualizer onGenerateVideo={() => {}} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Painting Scene...')).toBeInTheDocument();
  });

  it('shows video loading state when videoLoading is true', () => {
    vi.mocked(useMediaEngineContext).mockReturnValue({
      gallery: [],
      currentIndex: 0,
      currentMedia: null,
      imageLoading: false,
      videoLoading: true,
      autoPaint: false,
      quality: 'fast',
      setAutoPaint: vi.fn(),
      setQuality: vi.fn(),
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: mockGenerateImageForScene,
      regenerateCurrent: mockRegenerateCurrent,
      nextImage: mockNextImage,
      prevImage: mockPrevImage,
      canPaintNew: false,
    });
    render(<Visualizer onGenerateVideo={() => {}} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Rendering Animation...')).toBeInTheDocument();
  });

  it('shows empty state when no mediaItem and not loading', () => {
    render(<Visualizer onGenerateVideo={() => {}} />);
    expect(screen.getByText('No Visual Data')).toBeInTheDocument();
  });

  it('shows media content when mediaItem is present', () => {
    const mediaItem = createMediaItem();
    vi.mocked(useMediaEngineContext).mockReturnValue({
      gallery: [mediaItem],
      currentIndex: 0,
      currentMedia: mediaItem,
      imageLoading: false,
      videoLoading: false,
      autoPaint: false,
      quality: 'fast',
      setAutoPaint: vi.fn(),
      setQuality: vi.fn(),
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: mockGenerateImageForScene,
      regenerateCurrent: mockRegenerateCurrent,
      nextImage: mockNextImage,
      prevImage: mockPrevImage,
      canPaintNew: false,
    });
    render(<Visualizer onGenerateVideo={() => {}} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('shows NewSceneBadge when canPaintNew is true and not loading', () => {
    const mediaItem = createMediaItem();
    vi.mocked(useMediaEngineContext).mockReturnValue({
      gallery: [mediaItem],
      currentIndex: 0,
      currentMedia: mediaItem,
      imageLoading: false,
      videoLoading: false,
      autoPaint: false,
      quality: 'fast',
      setAutoPaint: vi.fn(),
      setQuality: vi.fn(),
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: mockGenerateImageForScene,
      regenerateCurrent: mockRegenerateCurrent,
      nextImage: mockNextImage,
      prevImage: mockPrevImage,
      canPaintNew: true,
    });
    render(<Visualizer onGenerateVideo={() => {}} />);
    expect(screen.getByText('New Scene Available')).toBeInTheDocument();
  });

  it('hides NewSceneBadge when loading', () => {
    vi.mocked(useMediaEngineContext).mockReturnValue({
      gallery: [],
      currentIndex: 0,
      currentMedia: null,
      imageLoading: true,
      videoLoading: false,
      autoPaint: false,
      quality: 'fast',
      setAutoPaint: vi.fn(),
      setQuality: vi.fn(),
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: mockGenerateImageForScene,
      regenerateCurrent: mockRegenerateCurrent,
      nextImage: mockNextImage,
      prevImage: mockPrevImage,
      canPaintNew: true,
    });
    render(<Visualizer onGenerateVideo={() => {}} />);
    expect(screen.queryByText('New Scene Available')).not.toBeInTheDocument();
  });

  it('shows ActionButtons when mediaItem present and not loading', () => {
    const mediaItem = createMediaItem();
    vi.mocked(useMediaEngineContext).mockReturnValue({
      gallery: [mediaItem],
      currentIndex: 0,
      currentMedia: mediaItem,
      imageLoading: false,
      videoLoading: false,
      autoPaint: false,
      quality: 'fast',
      setAutoPaint: vi.fn(),
      setQuality: vi.fn(),
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: mockGenerateImageForScene,
      regenerateCurrent: mockRegenerateCurrent,
      nextImage: mockNextImage,
      prevImage: mockPrevImage,
      canPaintNew: false,
    });
    render(<Visualizer onGenerateVideo={() => {}} />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('renders ScanlineOverlay when no video', () => {
    const mediaItem = createMediaItem({ videoUrl: null });
    vi.mocked(useMediaEngineContext).mockReturnValue({
      gallery: [mediaItem],
      currentIndex: 0,
      currentMedia: mediaItem,
      imageLoading: false,
      videoLoading: false,
      autoPaint: false,
      quality: 'fast',
      setAutoPaint: vi.fn(),
      setQuality: vi.fn(),
      setScenePrompt: vi.fn(),
      generateVideo: vi.fn(),
      generateImageForScene: mockGenerateImageForScene,
      regenerateCurrent: mockRegenerateCurrent,
      nextImage: mockNextImage,
      prevImage: mockPrevImage,
      canPaintNew: false,
    });
    const { container } = render(<Visualizer onGenerateVideo={() => {}} />);
    const overlayDivs = container.querySelectorAll('.pointer-events-none');
    expect(overlayDivs.length).toBeGreaterThan(0);
  });
});

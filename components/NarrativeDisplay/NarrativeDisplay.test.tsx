import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AudioControls } from './AudioControls';
import { LoadingIndicator } from './LoadingIndicator';
import { NarrativeHeader } from './NarrativeHeader';
import { StoryText } from './StoryText';
import { NarrativeDisplay } from './index';
import { GameResponse } from '@/types';

vi.mock('@/utils/markdown', () => ({
  renderMarkdown: (text: string) => text
}));

const mockToggleAudio = vi.fn();
vi.mock('@/hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => ({
    isPlaying: false,
    isLoading: false,
    toggleAudio: mockToggleAudio
  })
}));

Element.prototype.scrollIntoView = vi.fn();

describe('AudioControls', () => {
  const defaultProps = {
    isPlaying: false,
    isLoading: false,
    onToggle: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders READ ALOUD when not playing and not loading', () => {
    render(<AudioControls {...defaultProps} />);
    expect(screen.getByText('READ ALOUD')).toBeInTheDocument();
  });

  it('renders STOP NARRATION when playing', () => {
    render(<AudioControls {...defaultProps} isPlaying={true} />);
    expect(screen.getByText('STOP NARRATION')).toBeInTheDocument();
  });

  it('renders INITIALIZING... when loading', () => {
    render(<AudioControls {...defaultProps} isLoading={true} />);
    expect(screen.getByText('INITIALIZING...')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<AudioControls {...defaultProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<AudioControls {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is not disabled when not loading', () => {
    render(<AudioControls {...defaultProps} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});

describe('LoadingIndicator', () => {
  it('renders three loading dots', () => {
    const { container } = render(<LoadingIndicator />);
    const dots = container.querySelectorAll('span.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('has animate-pulse class on container', () => {
    const { container } = render(<LoadingIndicator />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});

describe('NarrativeHeader', () => {
  const defaultProps = {
    isPlaying: false,
    isLoading: false,
    onAudioToggle: vi.fn()
  };

  it('renders Adventure Log text', () => {
    render(<NarrativeHeader {...defaultProps} />);
    expect(screen.getByText('Adventure Log')).toBeInTheDocument();
  });

  it('renders AudioControls component', () => {
    render(<NarrativeHeader {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('READ ALOUD')).toBeInTheDocument();
  });

  it('passes props to AudioControls', () => {
    const onAudioToggle = vi.fn();
    render(<NarrativeHeader {...defaultProps} isPlaying={true} onAudioToggle={onAudioToggle} />);
    expect(screen.getByText('STOP NARRATION')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onAudioToggle).toHaveBeenCalledTimes(1);
  });
});

describe('StoryText', () => {
  it('renders paragraphs from narrative', () => {
    render(<StoryText narrative="First paragraph" />);
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
  });

  it('splits narrative by newlines into separate paragraphs', () => {
    const narrative = `First line
Second line`;
    const { container } = render(<StoryText narrative={narrative} />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(screen.getByText('First line')).toBeInTheDocument();
    expect(screen.getByText('Second line')).toBeInTheDocument();
  });

  it('skips empty lines', () => {
    const narrative = `First


Second`;
    const { container } = render(<StoryText narrative={narrative} />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
  });

  it('trims whitespace from paragraphs', () => {
    render(<StoryText narrative="  Trimmed text  " />);
    expect(screen.getByText('Trimmed text')).toBeInTheDocument();
  });
});

describe('NarrativeDisplay', () => {
  const mockResponse: GameResponse = {
    scenePrompt: 'A dark forest',
    narrative: 'You stand at the edge of a mysterious forest.',
    status: null,
    choices: [],
    rawText: 'raw text'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when no response and isLoading is true', () => {
    render(<NarrativeDisplay response={null} isLoading={true} />);
    expect(screen.getByText('Summoning world data...')).toBeInTheDocument();
  });

  it('shows empty state when no response and not loading', () => {
    render(<NarrativeDisplay response={null} isLoading={false} />);
    expect(screen.getByText('The void awaits your presence...')).toBeInTheDocument();
  });

  it('renders narrative content when response is provided', () => {
    render(<NarrativeDisplay response={mockResponse} isLoading={false} />);
    expect(screen.getByText('You stand at the edge of a mysterious forest.')).toBeInTheDocument();
  });

  it('renders NarrativeHeader with Adventure Log', () => {
    render(<NarrativeDisplay response={mockResponse} isLoading={false} />);
    expect(screen.getByText('Adventure Log')).toBeInTheDocument();
  });

  it('shows LoadingIndicator when response exists and isLoading is true', () => {
    const { container } = render(<NarrativeDisplay response={mockResponse} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('does not show LoadingIndicator when not loading', () => {
    const { container } = render(<NarrativeDisplay response={mockResponse} isLoading={false} />);
    const loadingDots = container.querySelectorAll('span.rounded-full');
    expect(loadingDots).toHaveLength(0);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudioPlayer } from './useAudioPlayer';

vi.mock('@/services/gemini', () => ({
  generateSpeech: vi.fn()
}));

vi.mock('@/utils/audio', () => ({
  decodeBase64: vi.fn(),
  decodeAudioData: vi.fn()
}));

import { generateSpeech } from '@/services/gemini';
import { decodeBase64, decodeAudioData } from '@/utils/audio';

const mockGenerateSpeech = vi.mocked(generateSpeech);
const mockDecodeBase64 = vi.mocked(decodeBase64);
const mockDecodeAudioData = vi.mocked(decodeAudioData);

describe('useAudioPlayer', () => {
  let mockSourceNode: {
    buffer: AudioBuffer | null;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
  };

  let mockAudioContext: {
    createBufferSource: ReturnType<typeof vi.fn>;
    destination: AudioDestinationNode;
    close: ReturnType<typeof vi.fn>;
  };

  let MockAudioContextSpy: (options?: AudioContextOptions) => void;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSourceNode = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null
    };

    mockAudioContext = {
      createBufferSource: vi.fn().mockReturnValue(mockSourceNode),
      destination: {} as AudioDestinationNode,
      close: vi.fn()
    };

    MockAudioContextSpy = vi.fn<(options?: AudioContextOptions) => void>();
    const createMockAudioContext = function(this: typeof mockAudioContext, options?: AudioContextOptions) {
      MockAudioContextSpy(options);
      Object.assign(this, mockAudioContext);
    };
    (window as { AudioContext: typeof AudioContext }).AudioContext = createMockAudioContext as unknown as typeof AudioContext;

    mockDecodeBase64.mockReturnValue(new Uint8Array([1, 2, 3]));
    mockDecodeAudioData.mockResolvedValue({} as AudioBuffer);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('starts with isPlaying false', () => {
      const { result } = renderHook(() => useAudioPlayer('test narrative'));

      expect(result.current.isPlaying).toBe(false);
    });

    it('starts with isLoading false', () => {
      const { result } = renderHook(() => useAudioPlayer('test narrative'));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('toggleAudio', () => {
    it('calls generateSpeech and sets up audio when narrative exists', async () => {
      mockGenerateSpeech.mockResolvedValue('base64audiodata');
      const { result } = renderHook(() => useAudioPlayer('Hello world'));

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(mockGenerateSpeech).toHaveBeenCalledWith('Hello world');
      expect(mockDecodeBase64).toHaveBeenCalledWith('base64audiodata');
      expect(mockDecodeAudioData).toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockSourceNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockSourceNode.start).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(true);
    });

    it('strips markdown formatting before generating speech', async () => {
      mockGenerateSpeech.mockResolvedValue('base64audiodata');
      const { result } = renderHook(() => useAudioPlayer('**Bold** and *italic* text'));

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(mockGenerateSpeech).toHaveBeenCalledWith('Bold and italic text');
    });

    it('stops audio when already playing', async () => {
      mockGenerateSpeech.mockResolvedValue('base64audiodata');
      const { result } = renderHook(() => useAudioPlayer('Test'));

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(result.current.isPlaying).toBe(true);

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(mockSourceNode.stop).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });

    it('does nothing when narrative is undefined', async () => {
      const { result } = renderHook(() => useAudioPlayer(undefined));

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(mockGenerateSpeech).not.toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading during audio generation', async () => {
      let resolveGenerate: (value: string) => void;
      const generatePromise = new Promise<string>((resolve) => {
        resolveGenerate = resolve;
      });
      mockGenerateSpeech.mockReturnValue(generatePromise);

      const { result } = renderHook(() => useAudioPlayer('Test'));

      act(() => {
        result.current.toggleAudio();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolveGenerate!('base64audiodata');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('creates AudioContext with correct sample rate', async () => {
      mockGenerateSpeech.mockResolvedValue('base64audiodata');
      const { result } = renderHook(() => useAudioPlayer('Test'));

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(MockAudioContextSpy).toHaveBeenCalledWith({ sampleRate: 24000 });
    });
  });

  describe('error handling', () => {
    it('handles generateSpeech failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGenerateSpeech.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useAudioPlayer('Test'));

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to play audio:', expect.any(Error));
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoading).toBe(false);

      consoleSpy.mockRestore();
    });

    it('throws error when no audio data received', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGenerateSpeech.mockResolvedValue(null);

      const { result } = renderHook(() => useAudioPlayer('Test'));

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to play audio:',
        expect.objectContaining({ message: 'No audio data received' })
      );
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoading).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('narrative change', () => {
    it('stops audio when narrative changes', async () => {
      mockGenerateSpeech.mockResolvedValue('base64audiodata');
      const { result, rerender } = renderHook(
        ({ narrative }) => useAudioPlayer(narrative),
        { initialProps: { narrative: 'First narrative' } }
      );

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(result.current.isPlaying).toBe(true);

      rerender({ narrative: 'Second narrative' });

      expect(mockSourceNode.stop).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('stops audio on unmount', async () => {
      mockGenerateSpeech.mockResolvedValue('base64audiodata');
      const { result, unmount } = renderHook(() => useAudioPlayer('Test'));

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(result.current.isPlaying).toBe(true);

      unmount();

      expect(mockSourceNode.stop).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe('onended callback', () => {
    it('sets isPlaying to false when audio ends naturally', async () => {
      mockGenerateSpeech.mockResolvedValue('base64audiodata');
      const { result } = renderHook(() => useAudioPlayer('Test'));

      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        mockSourceNode.onended?.();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });
});

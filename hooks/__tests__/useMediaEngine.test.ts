import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMediaEngine } from '../useMediaEngine';

vi.mock('@/services/gemini', () => ({
  generateSceneImage: vi.fn(),
  generateSceneVideo: vi.fn()
}));

import { generateSceneImage, generateSceneVideo } from '@/services/gemini';

const mockGenerateSceneImage = generateSceneImage as ReturnType<typeof vi.fn>;
const mockGenerateSceneVideo = generateSceneVideo as ReturnType<typeof vi.fn>;

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('useMediaEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with empty gallery', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.gallery).toEqual([]);
    });

    it('starts with currentIndex 0', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.currentIndex).toBe(0);
    });

    it('starts with currentMedia null', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.currentMedia).toBeNull();
    });

    it('starts with autoPaint false', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.autoPaint).toBe(false);
    });

    it('starts with imageLoading false', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.imageLoading).toBe(false);
    });

    it('starts with videoLoading false', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.videoLoading).toBe(false);
    });
  });

  describe('loading gallery from localStorage', () => {
    it('loads gallery from localStorage on mount', () => {
      const savedGallery = [
        { id: '1', url: 'image1.png', videoUrl: null, prompt: 'test prompt', timestamp: 1000 },
        { id: '2', url: 'image2.png', videoUrl: 'video.mp4', prompt: 'another prompt', timestamp: 2000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: savedGallery }));
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.gallery).toEqual(savedGallery);
    });

    it('sets currentIndex to last item after loading', () => {
      const savedGallery = [
        { id: '1', url: 'image1.png', videoUrl: null, prompt: 'test', timestamp: 1000 },
        { id: '2', url: 'image2.png', videoUrl: null, prompt: 'test2', timestamp: 2000 },
        { id: '3', url: 'image3.png', videoUrl: null, prompt: 'test3', timestamp: 3000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: savedGallery }));
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.currentIndex).toBe(2);
    });

    it('sets currentMedia to last item after loading', () => {
      const savedGallery = [
        { id: '1', url: 'image1.png', videoUrl: null, prompt: 'test', timestamp: 1000 },
        { id: '2', url: 'image2.png', videoUrl: null, prompt: 'test2', timestamp: 2000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: savedGallery }));
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.currentMedia).toEqual(savedGallery[1]);
    });
  });

  describe('legacy save format migration', () => {
    it('migrates legacy sceneImage format to gallery', () => {
      const legacyData = { sceneImage: 'legacy-image-url.png' };
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(legacyData));
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.gallery).toHaveLength(1);
      expect(result.current.gallery[0].url).toBe('legacy-image-url.png');
      expect(result.current.gallery[0].prompt).toBe('Restored Image');
      expect(result.current.gallery[0].videoUrl).toBeNull();
    });

    it('generates id with legacy prefix for migrated items', () => {
      const legacyData = { sceneImage: 'legacy-image.png' };
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(legacyData));
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.gallery[0].id).toMatch(/^legacy-/);
    });

    it('does not migrate if gallery already exists', () => {
      const dataWithBoth = {
        gallery: [{ id: '1', url: 'gallery-image.png', videoUrl: null, prompt: 'test', timestamp: 1000 }],
        sceneImage: 'legacy-image.png'
      };
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(dataWithBoth));
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.gallery).toHaveLength(1);
      expect(result.current.gallery[0].url).toBe('gallery-image.png');
    });

    it('handles invalid JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValueOnce('invalid json');
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.gallery).toEqual([]);
    });
  });

  describe('generateImageForScene', () => {
    it('generates image and adds to gallery', async () => {
      mockGenerateSceneImage.mockResolvedValueOnce('base64-image-data');
      
      const { result } = renderHook(() => useMediaEngine('A dark forest', 'fast'));
      
      await act(async () => {
        result.current.generateImageForScene();
      });
      
      expect(mockGenerateSceneImage).toHaveBeenCalledWith('A dark forest', 'fast');
      expect(result.current.gallery).toHaveLength(1);
      expect(result.current.gallery[0].url).toBe('base64-image-data');
      expect(result.current.gallery[0].prompt).toBe('A dark forest');
    });

    it('sets imageLoading during generation', async () => {
      let resolvePromise: (value: string) => void;
      mockGenerateSceneImage.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));
      
      const { result } = renderHook(() => useMediaEngine('test prompt', 'fast'));
      
      act(() => {
        result.current.generateImageForScene();
      });
      
      expect(result.current.imageLoading).toBe(true);
      
      await act(async () => {
        resolvePromise!('image-data');
      });
      
      expect(result.current.imageLoading).toBe(false);
    });

    it('updates currentIndex to new image', async () => {
      mockGenerateSceneImage.mockResolvedValue('image-data');
      
      const { result } = renderHook(() => useMediaEngine('prompt', 'fast'));
      
      await act(async () => {
        result.current.generateImageForScene();
      });
      
      expect(result.current.currentIndex).toBe(0);
      
      await act(async () => {
        result.current.generateImageForScene();
      });
      
      expect(result.current.currentIndex).toBe(1);
    });

    it('does not generate if scenePrompt is empty', async () => {
      const { result } = renderHook(() => useMediaEngine('', 'fast'));
      
      await act(async () => {
        result.current.generateImageForScene();
      });
      
      expect(mockGenerateSceneImage).not.toHaveBeenCalled();
    });

    it('does not generate if scenePrompt is undefined', async () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      await act(async () => {
        result.current.generateImageForScene();
      });
      
      expect(mockGenerateSceneImage).not.toHaveBeenCalled();
    });

    it('uses quality parameter', async () => {
      mockGenerateSceneImage.mockResolvedValueOnce('image-data');
      
      const { result } = renderHook(() => useMediaEngine('prompt', 'quality'));
      
      await act(async () => {
        result.current.generateImageForScene();
      });
      
      expect(mockGenerateSceneImage).toHaveBeenCalledWith('prompt', 'quality');
    });
  });

  describe('regenerateCurrent', () => {
    it('generates new image for current scene', async () => {
      mockGenerateSceneImage.mockResolvedValue('new-image-data');
      
      const { result } = renderHook(() => useMediaEngine('Current scene', 'fast'));
      
      await act(async () => {
        await result.current.regenerateCurrent();
      });
      
      expect(mockGenerateSceneImage).toHaveBeenCalledWith('Current scene', 'fast');
      expect(result.current.gallery).toHaveLength(1);
    });

    it('appends new image to gallery instead of replacing', async () => {
      const existingGallery = [
        { id: '1', url: 'old-image.png', videoUrl: null, prompt: 'old prompt', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: existingGallery }));
      mockGenerateSceneImage.mockResolvedValueOnce('regenerated-image');
      
      const { result } = renderHook(() => useMediaEngine('new prompt', 'fast'));
      
      await act(async () => {
        await result.current.regenerateCurrent();
      });
      
      expect(result.current.gallery).toHaveLength(2);
      expect(result.current.gallery[0].url).toBe('old-image.png');
      expect(result.current.gallery[1].url).toBe('regenerated-image');
    });

    it('does nothing if scenePrompt is undefined', async () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      await act(async () => {
        await result.current.regenerateCurrent();
      });
      
      expect(mockGenerateSceneImage).not.toHaveBeenCalled();
    });

    it('sets imageLoading during regeneration', async () => {
      let resolvePromise: (value: string) => void;
      mockGenerateSceneImage.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));
      
      const { result } = renderHook(() => useMediaEngine('test', 'fast'));
      
      act(() => {
        result.current.regenerateCurrent();
      });
      
      expect(result.current.imageLoading).toBe(true);
      
      await act(async () => {
        resolvePromise!('image');
      });
      
      expect(result.current.imageLoading).toBe(false);
    });
  });

  describe('generateVideo', () => {
    it('generates video and updates current item', async () => {
      const existingGallery = [
        { id: '1', url: 'image.png', videoUrl: null, prompt: 'test prompt', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: existingGallery }));
      mockGenerateSceneVideo.mockResolvedValueOnce('video-url.mp4');
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      const success = await act(async () => {
        return await result.current.generateVideo();
      });
      
      expect(success).toBe(true);
      expect(mockGenerateSceneVideo).toHaveBeenCalledWith('test prompt', 'image.png');
      expect(result.current.gallery[0].videoUrl).toBe('video-url.mp4');
    });

    it('sets videoLoading during generation', async () => {
      const existingGallery = [
        { id: '1', url: 'image.png', videoUrl: null, prompt: 'test', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: existingGallery }));
      
      let resolvePromise: (value: string) => void;
      mockGenerateSceneVideo.mockReturnValueOnce(new Promise(resolve => { resolvePromise = resolve; }));
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      act(() => {
        result.current.generateVideo();
      });
      
      expect(result.current.videoLoading).toBe(true);
      
      await act(async () => {
        resolvePromise!('video.mp4');
      });
      
      expect(result.current.videoLoading).toBe(false);
    });

    it('returns false when gallery is empty', async () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      const success = await act(async () => {
        return await result.current.generateVideo();
      });
      
      expect(success).toBe(false);
      expect(mockGenerateSceneVideo).not.toHaveBeenCalled();
    });

    it('returns false when current item has no url', async () => {
      const existingGallery = [
        { id: '1', url: '', videoUrl: null, prompt: 'test', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: existingGallery }));
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      const success = await act(async () => {
        return await result.current.generateVideo();
      });
      
      expect(success).toBe(false);
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      const galleryWith3Items = [
        { id: '1', url: 'img1.png', videoUrl: null, prompt: 'p1', timestamp: 1000 },
        { id: '2', url: 'img2.png', videoUrl: null, prompt: 'p2', timestamp: 2000 },
        { id: '3', url: 'img3.png', videoUrl: null, prompt: 'p3', timestamp: 3000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: galleryWith3Items }));
    });

    it('nextImage increments currentIndex', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      act(() => {
        result.current.prevImage();
        result.current.prevImage();
      });
      expect(result.current.currentIndex).toBe(0);
      
      act(() => {
        result.current.nextImage();
      });
      
      expect(result.current.currentIndex).toBe(1);
    });

    it('prevImage decrements currentIndex', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.currentIndex).toBe(2);
      
      act(() => {
        result.current.prevImage();
      });
      
      expect(result.current.currentIndex).toBe(1);
    });

    it('nextImage does not exceed gallery length', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.currentIndex).toBe(2);
      
      act(() => {
        result.current.nextImage();
        result.current.nextImage();
        result.current.nextImage();
      });
      
      expect(result.current.currentIndex).toBe(2);
    });

    it('prevImage does not go below 0', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      act(() => {
        result.current.prevImage();
        result.current.prevImage();
        result.current.prevImage();
        result.current.prevImage();
        result.current.prevImage();
      });
      
      expect(result.current.currentIndex).toBe(0);
    });

    it('updates currentMedia when navigating', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.currentMedia?.url).toBe('img3.png');
      
      act(() => {
        result.current.prevImage();
      });
      
      expect(result.current.currentMedia?.url).toBe('img2.png');
    });
  });

  describe('autoPaint', () => {
    it('setAutoPaint updates autoPaint state', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.autoPaint).toBe(false);
      
      act(() => {
        result.current.setAutoPaint(true);
      });
      
      expect(result.current.autoPaint).toBe(true);
    });

    it('triggers generateImage when scenePrompt changes with autoPaint enabled', async () => {
      mockGenerateSceneImage.mockResolvedValue('auto-generated-image');
      
      const { result, rerender } = renderHook(
        ({ prompt }) => useMediaEngine(prompt, 'fast'),
        { initialProps: { prompt: undefined as string | undefined } }
      );
      
      act(() => {
        result.current.setAutoPaint(true);
      });
      
      rerender({ prompt: 'New scene prompt' });
      
      await waitFor(() => {
        expect(mockGenerateSceneImage).toHaveBeenCalledWith('New scene prompt', 'fast');
      });
    });

    it('does not trigger when autoPaint is disabled', async () => {
      const { result, rerender } = renderHook(
        ({ prompt }) => useMediaEngine(prompt, 'fast'),
        { initialProps: { prompt: undefined as string | undefined } }
      );
      
      expect(result.current.autoPaint).toBe(false);
      
      rerender({ prompt: 'New scene' });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(mockGenerateSceneImage).not.toHaveBeenCalled();
    });

    it('does not trigger when prompt matches last gallery item', async () => {
      const existingGallery = [
        { id: '1', url: 'img.png', videoUrl: null, prompt: 'Same prompt', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: existingGallery }));
      
      const { result } = renderHook(() => useMediaEngine('Same prompt', 'fast'));
      
      act(() => {
        result.current.setAutoPaint(true);
      });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(mockGenerateSceneImage).not.toHaveBeenCalled();
    });
  });

  describe('canPaintNew', () => {
    it('returns false when scenePrompt is undefined', () => {
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      expect(result.current.canPaintNew).toBeFalsy();
    });

    it('returns false when scenePrompt is empty', () => {
      const { result } = renderHook(() => useMediaEngine('', 'fast'));
      
      expect(result.current.canPaintNew).toBeFalsy();
    });

    it('returns true when gallery is empty and prompt exists', () => {
      const { result } = renderHook(() => useMediaEngine('A scene', 'fast'));
      
      expect(result.current.canPaintNew).toBe(true);
    });

    it('returns true when prompt differs from last gallery item', () => {
      const existingGallery = [
        { id: '1', url: 'img.png', videoUrl: null, prompt: 'Old prompt', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: existingGallery }));
      
      const { result } = renderHook(() => useMediaEngine('New prompt', 'fast'));
      
      expect(result.current.canPaintNew).toBe(true);
    });

    it('returns false when prompt matches last gallery item', () => {
      const existingGallery = [
        { id: '1', url: 'img.png', videoUrl: null, prompt: 'Same prompt', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: existingGallery }));
      
      const { result } = renderHook(() => useMediaEngine('Same prompt', 'fast'));
      
      expect(result.current.canPaintNew).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles image generation failure gracefully', async () => {
      mockGenerateSceneImage.mockRejectedValueOnce(new Error('API error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useMediaEngine('prompt', 'fast'));
      
      await act(async () => {
        result.current.generateImageForScene();
      });
      
      expect(result.current.imageLoading).toBe(false);
      expect(result.current.gallery).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Image gen failed', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('handles regeneration failure gracefully', async () => {
      mockGenerateSceneImage.mockRejectedValueOnce(new Error('Regen error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useMediaEngine('prompt', 'fast'));
      
      await act(async () => {
        await result.current.regenerateCurrent();
      });
      
      expect(result.current.imageLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Regeneration failed', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('handles video generation failure gracefully', async () => {
      const existingGallery = [
        { id: '1', url: 'img.png', videoUrl: null, prompt: 'test', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: existingGallery }));
      mockGenerateSceneVideo.mockRejectedValueOnce(new Error('Video error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      const success = await act(async () => {
        return await result.current.generateVideo();
      });
      
      expect(success).toBe(false);
      expect(result.current.videoLoading).toBe(false);
      expect(result.current.gallery[0].videoUrl).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Video gen failed', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('handles null response from image generation', async () => {
      mockGenerateSceneImage.mockResolvedValueOnce(null);
      
      const { result } = renderHook(() => useMediaEngine('prompt', 'fast'));
      
      await act(async () => {
        result.current.generateImageForScene();
      });
      
      expect(result.current.gallery).toEqual([]);
    });

    it('handles null response from video generation', async () => {
      const existingGallery = [
        { id: '1', url: 'img.png', videoUrl: null, prompt: 'test', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ gallery: existingGallery }));
      mockGenerateSceneVideo.mockResolvedValueOnce(null);
      
      const { result } = renderHook(() => useMediaEngine(undefined, 'fast'));
      
      const success = await act(async () => {
        return await result.current.generateVideo();
      });
      
      expect(success).toBe(false);
      expect(result.current.gallery[0].videoUrl).toBeNull();
    });
  });
});

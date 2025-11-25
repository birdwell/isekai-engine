import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameState } from './useGameState';

vi.mock('@/services/gemini', () => ({
  generateAdventureText: vi.fn()
}));

vi.mock('./useQuestSystem', () => ({
  useQuestSystem: () => ({
    questState: { quests: [], activeQuestId: null },
    updateQuestFromNarrative: vi.fn(),
    loadQuestState: vi.fn()
  })
}));

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

describe('useGameState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('starts with empty history', () => {
      const { result } = renderHook(() => useGameState(false));
      
      expect(result.current.history).toEqual([]);
    });

    it('starts with null lastResponse', () => {
      const { result } = renderHook(() => useGameState(false));
      
      expect(result.current.lastResponse).toBeNull();
    });

    it('starts not loading', () => {
      const { result } = renderHook(() => useGameState(false));
      
      expect(result.current.loading).toBe(false);
    });

    it('starts with idle save status', () => {
      const { result } = renderHook(() => useGameState(false));
      
      expect(result.current.saveStatus).toBe('idle');
    });

    it('starts with game not started when no API key', () => {
      const { result } = renderHook(() => useGameState(false));
      
      expect(result.current.gameStarted).toBe(false);
    });
  });

  describe('saveGame', () => {
    it('saves to localStorage', () => {
      const { result } = renderHook(() => useGameState(false));
      
      act(() => {
        result.current.saveGame([]);
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'isekai_save',
        expect.any(String)
      );
    });

    it('returns true on successful save', () => {
      const { result } = renderHook(() => useGameState(false));
      
      let success: boolean = false;
      act(() => {
        success = result.current.saveGame([]);
      });
      
      expect(success).toBe(true);
    });

    it('includes gallery in save data', () => {
      const { result } = renderHook(() => useGameState(false));
      
      const gallery = [
        { id: '1', url: 'test.png', videoUrl: null, prompt: 'test', timestamp: 123 }
      ];
      
      act(() => {
        result.current.saveGame(gallery);
      });
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.gallery).toEqual(gallery);
    });

    it('includes timestamp in save data', () => {
      const { result } = renderHook(() => useGameState(false));
      
      const now = Date.now();
      
      act(() => {
        result.current.saveGame([]);
      });
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.timestamp).toBeGreaterThanOrEqual(now);
    });

    it('sets saveStatus to saving for auto-saves', () => {
      const { result } = renderHook(() => useGameState(false));
      
      act(() => {
        result.current.saveGame([], true);
      });
      
      expect(result.current.saveStatus).toBe('saved');
    });
  });

  describe('loadGame', () => {
    it('returns false when no save exists', () => {
      const { result } = renderHook(() => useGameState(false));
      
      let loaded: boolean = true;
      act(() => {
        loaded = result.current.loadGame();
      });
      
      expect(loaded).toBe(false);
    });

    it('returns true when valid save exists', () => {
      const saveData = {
        history: [{ role: 'user', text: 'Hello' }],
        lastResponse: null,
        gallery: [],
        questState: { quests: [], activeQuestId: null },
        timestamp: Date.now()
      };
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(saveData));
      
      const { result } = renderHook(() => useGameState(false));
      
      let loaded: boolean = false;
      act(() => {
        loaded = result.current.loadGame();
      });
      
      expect(loaded).toBe(true);
    });

    it('restores history from save', () => {
      const history = [
        { role: 'user' as const, text: 'First message' },
        { role: 'model' as const, text: 'Response' }
      ];
      const saveData = {
        history,
        lastResponse: null,
        gallery: [],
        questState: { quests: [], activeQuestId: null },
        timestamp: Date.now()
      };
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(saveData));
      
      const { result } = renderHook(() => useGameState(false));
      
      act(() => {
        result.current.loadGame();
      });
      
      expect(result.current.history).toEqual(history);
    });

    it('returns false for invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValueOnce('invalid json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useGameState(false));
      
      let loaded: boolean = true;
      act(() => {
        loaded = result.current.loadGame();
      });
      
      expect(loaded).toBe(false);
      consoleSpy.mockRestore();
    });

    it('returns false for save without history array', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ history: 'not array' }));
      
      const { result } = renderHook(() => useGameState(false));
      
      let loaded: boolean = true;
      act(() => {
        loaded = result.current.loadGame();
      });
      
      expect(loaded).toBe(false);
    });

    it('sets gameStarted to true after loading', () => {
      const saveData = {
        history: [{ role: 'user', text: 'Hello' }],
        lastResponse: null,
        gallery: [],
        questState: { quests: [], activeQuestId: null },
        timestamp: Date.now()
      };
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(saveData));
      
      const { result } = renderHook(() => useGameState(false));
      
      act(() => {
        result.current.loadGame();
      });
      
      expect(result.current.gameStarted).toBe(true);
    });
  });

  describe('startNewGame', () => {
    it('removes save from localStorage', () => {
      const { result } = renderHook(() => useGameState(false));
      
      delete (window as { location?: unknown }).location;
      (window as { location: { reload: () => void } }).location = { reload: vi.fn() };
      
      act(() => {
        result.current.startNewGame();
      });
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('isekai_save');
    });
  });

  describe('setGalleryRef', () => {
    it('is a function', () => {
      const { result } = renderHook(() => useGameState(false));
      
      expect(typeof result.current.setGalleryRef).toBe('function');
    });
  });

  describe('questLog', () => {
    it('returns empty array initially', () => {
      const { result } = renderHook(() => useGameState(false));
      
      expect(result.current.questLog).toEqual([]);
    });
  });

  describe('lastAutoSave', () => {
    it('is null initially', () => {
      const { result } = renderHook(() => useGameState(false));
      
      expect(result.current.lastAutoSave).toBeNull();
    });
  });
});

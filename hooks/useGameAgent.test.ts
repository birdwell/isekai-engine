import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameAgent } from './useGameAgent';
import { QuestStatus, QuestType } from '../types';

vi.mock('@/services/agent', () => {
  const mockAgent = {
    processInput: vi.fn(),
    getMemory: vi.fn(() => ({
      character: null,
      world: { worldType: '', currentLocation: 'Divine Realm', visitedLocations: [], knownNPCs: [], globalFlags: {} },
      eventLog: [],
      lastSummary: '',
      lastSummaryTurn: 0,
    })),
    getQuests: vi.fn(() => []),
    getTurnCount: vi.fn(() => 0),
    loadState: vi.fn(),
  };

  return {
    GameMasterAgent: vi.fn(() => mockAgent),
    createGameMaster: vi.fn(() => mockAgent),
    loadMemory: vi.fn(),
    saveMemory: vi.fn(),
    clearMemory: vi.fn(),
    createInitialMemory: vi.fn(() => ({
      character: null,
      world: { worldType: '', currentLocation: 'Divine Realm', visitedLocations: [], knownNPCs: [], globalFlags: {} },
      eventLog: [],
      lastSummary: '',
      lastSummaryTurn: 0,
    })),
  };
});

import { createGameMaster, saveMemory, clearMemory } from '@/services/agent';

const mockCreateGameMaster = createGameMaster as ReturnType<typeof vi.fn>;
const mockSaveMemory = saveMemory as ReturnType<typeof vi.fn>;
const mockClearMemory = clearMemory as ReturnType<typeof vi.fn>;

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

const mockLocationReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockLocationReload },
  writable: true,
});

describe('useGameAgent', () => {
  let mockAgent: ReturnType<typeof createMockAgent>;

  function createMockAgent() {
    return {
      processInput: vi.fn(),
      getMemory: vi.fn(() => ({
        character: null,
        world: { worldType: '', currentLocation: 'Divine Realm', visitedLocations: [], knownNPCs: [], globalFlags: {} },
        eventLog: [],
        lastSummary: '',
        lastSummaryTurn: 0,
      })),
      getQuests: vi.fn(() => []),
      getTurnCount: vi.fn(() => 0),
      loadState: vi.fn(),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockAgent = createMockAgent();
    mockCreateGameMaster.mockReturnValue(mockAgent);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with loading false', () => {
      const { result } = renderHook(() => useGameAgent(false));
      expect(result.current.loading).toBe(false);
    });

    it('starts with saveStatus idle', () => {
      const { result } = renderHook(() => useGameAgent(false));
      expect(result.current.saveStatus).toBe('idle');
    });

    it('starts with lastResponse null', () => {
      const { result } = renderHook(() => useGameAgent(false));
      expect(result.current.lastResponse).toBeNull();
    });

    it('starts with empty quests', () => {
      const { result } = renderHook(() => useGameAgent(false));
      expect(result.current.quests).toEqual([]);
    });
  });

  describe('loadGame', () => {
    it('returns false when no saved data exists', () => {
      const { result } = renderHook(() => useGameAgent(false));

      const loaded = result.current.loadGame();

      expect(loaded).toBe(false);
    });

    it('loads game state from localStorage', () => {
      const savedData = {
        memory: {
          character: { name: 'Hero', class: 'Warrior', cheatSkill: 'Power', visualTags: [], createdAt: 1000 },
          world: { worldType: 'Fantasy', currentLocation: 'Town', visitedLocations: ['Town'], knownNPCs: [], globalFlags: {} },
          eventLog: [],
          lastSummary: '',
          lastSummaryTurn: 0,
        },
        lastResponse: {
          scenePrompt: 'A town square',
          narrative: 'You stand in the town square.',
          status: { hp: '100/100', location: 'Town', inventory: [], skills: [], activeQuest: '', currency: { gold: 10, silver: 0, copper: 0 } },
          choices: [{ id: 'a', text: 'Explore' }],
          rawText: '{}',
        },
        gallery: [],
        turnCount: 5,
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const { result } = renderHook(() => useGameAgent(false));

      const loaded = result.current.loadGame();

      expect(loaded).toBe(true);
      expect(mockAgent.loadState).toHaveBeenCalledWith(
        savedData.memory,
        savedData.lastResponse.status,
        [],
        savedData.turnCount
      );
    });

    it('sets lastResponse after loading', () => {
      const savedData = {
        memory: {
          character: null,
          world: { worldType: '', currentLocation: 'Divine Realm', visitedLocations: [], knownNPCs: [], globalFlags: {} },
          eventLog: [],
          lastSummary: '',
          lastSummaryTurn: 0,
        },
        lastResponse: {
          scenePrompt: 'A scene',
          narrative: 'The story.',
          status: { hp: '80/100', location: 'Forest', inventory: ['sword'], skills: [], activeQuest: 'Find treasure', currency: { gold: 5, silver: 0, copper: 0 } },
          choices: [],
          rawText: '{}',
        },
        gallery: [],
        turnCount: 3,
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const { result } = renderHook(() => useGameAgent(false));

      act(() => {
        result.current.loadGame();
      });

      expect(result.current.lastResponse).toEqual(savedData.lastResponse);
    });

    it('handles null status in lastResponse', () => {
      const savedData = {
        memory: {
          character: null,
          world: { worldType: '', currentLocation: 'Divine Realm', visitedLocations: [], knownNPCs: [], globalFlags: {} },
          eventLog: [],
          lastSummary: '',
          lastSummaryTurn: 0,
        },
        lastResponse: {
          scenePrompt: 'A scene',
          narrative: 'The story.',
          status: null,
          choices: [],
          rawText: '{}',
        },
        gallery: [],
        turnCount: 1,
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const { result } = renderHook(() => useGameAgent(false));

      const loaded = result.current.loadGame();

      expect(loaded).toBe(true);
      expect(mockAgent.loadState).toHaveBeenCalledWith(
        savedData.memory,
        null,
        [],
        savedData.turnCount
      );
    });

    it('returns false and logs error on parse failure', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useGameAgent(false));

      const loaded = result.current.loadGame();

      expect(loaded).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load save:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('startNewGame', () => {
    it('removes save from localStorage', () => {
      const { result } = renderHook(() => useGameAgent(false));

      result.current.startNewGame();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('isekai_agent_save');
    });

    it('clears memory', () => {
      const { result } = renderHook(() => useGameAgent(false));

      result.current.startNewGame();

      expect(mockClearMemory).toHaveBeenCalled();
    });

    it('reloads the page', () => {
      const { result } = renderHook(() => useGameAgent(false));

      result.current.startNewGame();

      expect(mockLocationReload).toHaveBeenCalled();
    });
  });

  describe('auto-save', () => {
    it('triggers auto-save at interval when game is started', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAgent.processInput.mockResolvedValue({
        scenePrompt: 'Scene',
        narrative: 'Narrative',
        status: { hp: '100/100', location: 'Test', inventory: [], skills: [], activeQuest: '', currency: { gold: 0, silver: 0, copper: 0 } },
        choices: [],
      });

      const { result } = renderHook(() => useGameAgent(true));

      await act(async () => {
        await result.current.handleTurn('test action');
      });

      mockLocalStorage.setItem.mockClear();

      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'isekai_agent_save',
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });

    it('does not auto-save when loading', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let resolveProcess: (value: unknown) => void;
      mockAgent.processInput.mockReturnValue(new Promise(resolve => { resolveProcess = resolve; }));

      const { result } = renderHook(() => useGameAgent(true));

      act(() => {
        result.current.handleTurn('test');
      });

      expect(result.current.loading).toBe(true);

      mockLocalStorage.setItem.mockClear();

      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      await act(async () => {
        resolveProcess!({
          scenePrompt: 'Scene',
          narrative: 'Narrative',
          status: { hp: '100/100', location: 'Test', inventory: [], skills: [], activeQuest: '', currency: { gold: 0, silver: 0, copper: 0 } },
          choices: [],
        });
      });
      consoleSpy.mockRestore();
    });
  });

  describe('handleTurn', () => {
    it('sets loading to true during processing', async () => {
      let resolveProcess: (value: unknown) => void;
      mockAgent.processInput.mockReturnValue(new Promise(resolve => { resolveProcess = resolve; }));

      const { result } = renderHook(() => useGameAgent(false));

      act(() => {
        result.current.handleTurn('explore the cave');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveProcess!({
          scenePrompt: 'A dark cave',
          narrative: 'You enter the cave.',
          status: { hp: '100/100', location: 'Cave', inventory: [], skills: [], activeQuest: '', currency: { gold: 0, silver: 0, copper: 0 } },
          choices: [{ id: 'a', text: 'Go deeper' }],
        });
      });

      expect(result.current.loading).toBe(false);
    });

    it('calls agent.processInput with user action', async () => {
      mockAgent.processInput.mockResolvedValue({
        scenePrompt: 'Scene',
        narrative: 'Narrative',
        status: { hp: '100/100', location: 'Test', inventory: [], skills: [], activeQuest: '', currency: { gold: 0, silver: 0, copper: 0 } },
        choices: [],
      });

      const { result } = renderHook(() => useGameAgent(false));

      await act(async () => {
        await result.current.handleTurn('attack the dragon');
      });

      expect(mockAgent.processInput).toHaveBeenCalledWith('attack the dragon');
    });

    it('sets lastResponse from agent response', async () => {
      const agentResponse = {
        scenePrompt: 'A battlefield',
        narrative: 'You face the dragon.',
        status: { hp: '50/100', location: 'Dragon Lair', inventory: ['sword'], skills: ['fireball'], activeQuest: 'Slay dragon', currency: { gold: 100, silver: 50, copper: 0 } },
        choices: [{ id: 'a', text: 'Attack' }, { id: 'b', text: 'Flee' }],
      };
      mockAgent.processInput.mockResolvedValue(agentResponse);

      const { result } = renderHook(() => useGameAgent(false));

      await act(async () => {
        await result.current.handleTurn('fight');
      });

      expect(result.current.lastResponse).toEqual({
        scenePrompt: agentResponse.scenePrompt,
        narrative: agentResponse.narrative,
        status: agentResponse.status,
        choices: agentResponse.choices,
        rawText: JSON.stringify(agentResponse),
      });
    });

    it('auto-saves every 5 turns when gallery has items', async () => {
      mockAgent.getTurnCount.mockReturnValue(5);
      mockAgent.processInput.mockResolvedValue({
        scenePrompt: 'Scene',
        narrative: 'Story',
        status: { hp: '100/100', location: 'Test', inventory: [], skills: [], activeQuest: '', currency: { gold: 0, silver: 0, copper: 0 } },
        choices: [],
      });

      const { result } = renderHook(() => useGameAgent(false));

      act(() => {
        result.current.setGalleryRef([{ id: '1', url: 'img.png', videoUrl: null, prompt: 'test', timestamp: 1000 }]);
      });

      mockLocalStorage.setItem.mockClear();

      await act(async () => {
        await result.current.handleTurn('action');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isekai_agent_save', expect.any(String));
    });

    it('handles errors gracefully', async () => {
      mockAgent.processInput.mockRejectedValue(new Error('API Error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useGameAgent(false));

      await act(async () => {
        await result.current.handleTurn('action');
      });

      expect(result.current.loading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Game Turn Error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('saveGame', () => {
    it('saves game state to localStorage', () => {
      mockAgent.processInput.mockResolvedValue({
        scenePrompt: 'Scene',
        narrative: 'Story',
        status: { hp: '100/100', location: 'Test', inventory: [], skills: [], activeQuest: '', currency: { gold: 0, silver: 0, copper: 0 } },
        choices: [],
      });

      const { result } = renderHook(() => useGameAgent(false));

      const saved = result.current.saveGame([]);

      expect(saved).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isekai_agent_save', expect.any(String));
      expect(mockSaveMemory).toHaveBeenCalled();
    });

    it('sets saveStatus to saving during auto-save', async () => {
      const { result } = renderHook(() => useGameAgent(false));

      act(() => {
        result.current.saveGame([], true);
      });

      expect(result.current.saveStatus).toBe('saved');
    });

    it('handles save errors', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => { throw new Error('Storage full'); });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useGameAgent(false));

      const saved = result.current.saveGame([]);

      expect(saved).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Save failed', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getQuestProgress', () => {
    it('returns 0 for non-existent quest', () => {
      const { result } = renderHook(() => useGameAgent(false));

      expect(result.current.questSystem.getQuestProgress('nonexistent')).toBe(0);
    });

    it('returns 0 for quest with no objectives', () => {
      mockAgent.getQuests.mockReturnValue([{
        id: 'quest1',
        title: 'Empty Quest',
        description: 'A quest',
        type: QuestType.Main,
        status: QuestStatus.Active,
        objectives: [],
        startedAt: 1000,
      }]);

      const { result } = renderHook(() => useGameAgent(false));

      expect(result.current.questSystem.getQuestProgress('quest1')).toBe(0);
    });

    it('returns correct percentage for partially completed quest', () => {
      mockAgent.getQuests.mockReturnValue([{
        id: 'quest1',
        title: 'Test Quest',
        description: 'A quest',
        type: QuestType.Main,
        status: QuestStatus.Active,
        objectives: [
          { id: 'obj1', description: 'Objective 1', isCompleted: true },
          { id: 'obj2', description: 'Objective 2', isCompleted: false },
          { id: 'obj3', description: 'Objective 3', isCompleted: true },
          { id: 'obj4', description: 'Objective 4', isCompleted: false },
        ],
        startedAt: 1000,
      }]);

      const { result } = renderHook(() => useGameAgent(false));

      expect(result.current.questSystem.getQuestProgress('quest1')).toBe(50);
    });

    it('returns 100 for fully completed quest', () => {
      mockAgent.getQuests.mockReturnValue([{
        id: 'quest1',
        title: 'Complete Quest',
        description: 'A quest',
        type: QuestType.Main,
        status: QuestStatus.Completed,
        objectives: [
          { id: 'obj1', description: 'Objective 1', isCompleted: true },
          { id: 'obj2', description: 'Objective 2', isCompleted: true },
        ],
        startedAt: 1000,
      }]);

      const { result } = renderHook(() => useGameAgent(false));

      expect(result.current.questSystem.getQuestProgress('quest1')).toBe(100);
    });
  });

  describe('questLog', () => {
    it('returns quest titles as questLog', () => {
      mockAgent.getQuests.mockReturnValue([
        { id: 'q1', title: 'Main Quest', description: '', type: QuestType.Main, status: QuestStatus.Active, objectives: [], startedAt: 1000 },
        { id: 'q2', title: 'Side Quest', description: '', type: QuestType.Side, status: QuestStatus.Active, objectives: [], startedAt: 2000 },
      ]);

      const { result } = renderHook(() => useGameAgent(false));

      expect(result.current.questLog).toEqual(['Main Quest', 'Side Quest']);
    });
  });

  describe('questSystem', () => {
    it('returns activeQuest based on QuestStatus.Active', () => {
      mockAgent.getQuests.mockReturnValue([
        { id: 'q1', title: 'Inactive Quest', description: '', type: QuestType.Main, status: QuestStatus.Completed, objectives: [], startedAt: 1000 },
        { id: 'q2', title: 'Active Quest', description: 'The active one', type: QuestType.Main, status: QuestStatus.Active, objectives: [], startedAt: 2000 },
      ]);

      const { result } = renderHook(() => useGameAgent(false));

      expect(result.current.questSystem.activeQuest?.id).toBe('q2');
      expect(result.current.questSystem.activeQuest?.title).toBe('Active Quest');
    });

    it('returns null for activeQuest when no active quests', () => {
      mockAgent.getQuests.mockReturnValue([
        { id: 'q1', title: 'Completed Quest', description: '', type: QuestType.Main, status: QuestStatus.Completed, objectives: [], startedAt: 1000 },
      ]);

      const { result } = renderHook(() => useGameAgent(false));

      expect(result.current.questSystem.activeQuest).toBeNull();
    });

    it('setActiveQuest is a no-op', () => {
      const { result } = renderHook(() => useGameAgent(false));

      expect(() => {
        result.current.questSystem.setActiveQuest('someId');
      }).not.toThrow();
    });
  });

  describe('setGalleryRef', () => {
    it('updates internal gallery reference', async () => {
      mockAgent.getTurnCount.mockReturnValue(5);
      mockAgent.processInput.mockResolvedValue({
        scenePrompt: 'Scene',
        narrative: 'Story',
        status: { hp: '100/100', location: 'Test', inventory: [], skills: [], activeQuest: '', currency: { gold: 0, silver: 0, copper: 0 } },
        choices: [],
      });

      const { result } = renderHook(() => useGameAgent(false));

      const gallery = [
        { id: '1', url: 'img1.png', videoUrl: null, prompt: 'p1', timestamp: 1000 },
        { id: '2', url: 'img2.png', videoUrl: 'vid.mp4', prompt: 'p2', timestamp: 2000 },
      ];

      act(() => {
        result.current.setGalleryRef(gallery);
      });

      mockLocalStorage.setItem.mockClear();

      await act(async () => {
        await result.current.handleTurn('action');
      });

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.gallery).toEqual(gallery);
    });
  });

  describe('initialization with API key', () => {
    it('loads saved game on mount when API key present', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const savedData = {
        memory: {
          character: null,
          world: { worldType: '', currentLocation: 'Divine Realm', visitedLocations: [], knownNPCs: [], globalFlags: {} },
          eventLog: [],
          lastSummary: '',
          lastSummaryTurn: 0,
        },
        lastResponse: {
          scenePrompt: 'Saved scene',
          narrative: 'Saved narrative',
          status: { hp: '100/100', location: 'Saved', inventory: [], skills: [], activeQuest: '', currency: { gold: 0, silver: 0, copper: 0 } },
          choices: [],
          rawText: '{}',
        },
        gallery: [],
        turnCount: 10,
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const { result } = renderHook(() => useGameAgent(true));

      expect(result.current.lastResponse).toEqual(savedData.lastResponse);
      expect(result.current.gameStarted).toBe(true);
      consoleSpy.mockRestore();
    });

    it('initializes new game when no save exists and API key present', async () => {
      vi.useRealTimers();
      mockLocalStorage.clear();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      mockAgent.processInput.mockResolvedValue({
        scenePrompt: 'Divine realm',
        narrative: 'Welcome traveler.',
        status: { hp: '100/100', location: 'Divine Realm', inventory: [], skills: [], activeQuest: '', currency: { gold: 0, silver: 0, copper: 0 } },
        choices: [],
      });

      renderHook(() => useGameAgent(true));

      await waitFor(() => {
        expect(mockAgent.processInput).toHaveBeenCalledWith(
          'Initialize simulation. Introduce yourself as The Administrator in the Divine Realm.'
        );
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createInitialMemory,
  saveMemory,
  loadMemory,
  clearMemory,
  addEventToLog,
  setCharacter,
  updateLocation,
  addOrUpdateNPC,
  needsSummary,
  updateSummary,
  getRelevantContext,
} from '../memory';
import { CharacterProfile, NPCProfile } from '../types';

describe('memory utilities', () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => null);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createInitialMemory', () => {
    it('returns memory with null character', () => {
      const memory = createInitialMemory();
      expect(memory.character).toBeNull();
    });

    it('returns memory with Divine Realm as starting location', () => {
      const memory = createInitialMemory();
      expect(memory.world.currentLocation).toBe('Divine Realm');
      expect(memory.world.visitedLocations).toContain('Divine Realm');
    });

    it('returns empty event log', () => {
      const memory = createInitialMemory();
      expect(memory.eventLog).toEqual([]);
    });

    it('returns empty summary state', () => {
      const memory = createInitialMemory();
      expect(memory.lastSummary).toBe('');
      expect(memory.lastSummaryTurn).toBe(0);
    });
  });

  describe('saveMemory', () => {
    it('saves memory to localStorage', () => {
      const memory = createInitialMemory();
      saveMemory(memory);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'isekai_agent_memory',
        JSON.stringify(memory)
      );
    });

    it('handles save errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      const memory = createInitialMemory();
      expect(() => saveMemory(memory)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('loadMemory', () => {
    it('returns null when no saved memory', () => {
      const result = loadMemory();
      expect(result).toBeNull();
    });

    it('returns parsed memory when saved', () => {
      const savedMemory = createInitialMemory();
      savedMemory.world.currentLocation = 'Test Location';
      
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
        JSON.stringify(savedMemory)
      );

      const result = loadMemory();
      expect(result?.world.currentLocation).toBe('Test Location');
    });

    it('handles parse errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');

      const result = loadMemory();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('clearMemory', () => {
    it('removes memory from localStorage', () => {
      clearMemory();
      expect(localStorage.removeItem).toHaveBeenCalledWith('isekai_agent_memory');
    });
  });

  describe('addEventToLog', () => {
    it('adds event with generated id and timestamp', () => {
      const memory = createInitialMemory();
      const result = addEventToLog(memory, {
        turn: 1,
        type: 'story',
        summary: 'Test event',
        importance: 'medium',
      });

      expect(result.eventLog).toHaveLength(1);
      expect(result.eventLog[0].id).toMatch(/^evt_/);
      expect(result.eventLog[0].timestamp).toBeDefined();
      expect(result.eventLog[0].summary).toBe('Test event');
    });

    it('preserves critical events when log exceeds 100', () => {
      const memory = createInitialMemory();
      
      // Add 100 low importance events
      for (let i = 0; i < 100; i++) {
        memory.eventLog.push({
          id: `evt_${i}`,
          turn: i,
          timestamp: Date.now(),
          type: 'story',
          summary: `Event ${i}`,
          importance: 'low',
        });
      }

      // Add a critical event early
      memory.eventLog[5] = {
        ...memory.eventLog[5],
        importance: 'critical',
        summary: 'Critical event',
      };

      const result = addEventToLog(memory, {
        turn: 101,
        type: 'story',
        summary: 'New event',
        importance: 'low',
      });

      const criticalEvents = result.eventLog.filter(e => e.importance === 'critical');
      expect(criticalEvents).toHaveLength(1);
      expect(criticalEvents[0].summary).toBe('Critical event');
    });
  });

  describe('setCharacter', () => {
    it('sets character profile', () => {
      const memory = createInitialMemory();
      const character: CharacterProfile = {
        name: 'Hero',
        class: 'Warrior',
        cheatSkill: 'Super Strength',
        visualTags: ['red hair', 'scar'],
        createdAt: Date.now(),
      };

      const result = setCharacter(memory, character);
      expect(result.character).toEqual(character);
    });

    it('preserves other memory fields', () => {
      const memory = createInitialMemory();
      memory.world.currentLocation = 'Custom Location';

      const character: CharacterProfile = {
        name: 'Hero',
        class: 'Warrior',
        cheatSkill: 'Super Strength',
        visualTags: [],
        createdAt: Date.now(),
      };

      const result = setCharacter(memory, character);
      expect(result.world.currentLocation).toBe('Custom Location');
    });
  });

  describe('updateLocation', () => {
    it('updates current location', () => {
      const memory = createInitialMemory();
      const result = updateLocation(memory, 'Dark Forest');
      expect(result.world.currentLocation).toBe('Dark Forest');
    });

    it('adds new location to visited list', () => {
      const memory = createInitialMemory();
      const result = updateLocation(memory, 'Dark Forest');
      expect(result.world.visitedLocations).toContain('Dark Forest');
    });

    it('does not duplicate visited locations', () => {
      const memory = createInitialMemory();
      memory.world.visitedLocations = ['Divine Realm', 'Dark Forest'];

      const result = updateLocation(memory, 'Dark Forest');
      expect(result.world.visitedLocations.filter(l => l === 'Dark Forest')).toHaveLength(1);
    });
  });

  describe('addOrUpdateNPC', () => {
    it('adds new NPC', () => {
      const memory = createInitialMemory();
      const npc: NPCProfile = {
        id: 'npc_1',
        name: 'Gandalf',
        visualTags: ['grey robes'],
        relationship: 'friendly',
        lastSeenLocation: 'Tower',
        notes: [],
      };

      const result = addOrUpdateNPC(memory, npc);
      expect(result.world.knownNPCs).toHaveLength(1);
      expect(result.world.knownNPCs[0].name).toBe('Gandalf');
    });

    it('updates existing NPC', () => {
      const memory = createInitialMemory();
      memory.world.knownNPCs = [{
        id: 'npc_1',
        name: 'Gandalf',
        visualTags: ['grey robes'],
        relationship: 'neutral',
        lastSeenLocation: 'Inn',
        notes: [],
      }];

      const updatedNpc: NPCProfile = {
        id: 'npc_1',
        name: 'Gandalf',
        visualTags: ['white robes'],
        relationship: 'ally',
        lastSeenLocation: 'Tower',
        notes: ['Now an ally'],
      };

      const result = addOrUpdateNPC(memory, updatedNpc);
      expect(result.world.knownNPCs).toHaveLength(1);
      expect(result.world.knownNPCs[0].relationship).toBe('ally');
      expect(result.world.knownNPCs[0].visualTags).toContain('white robes');
    });
  });

  describe('needsSummary', () => {
    it('returns false when below summary interval', () => {
      const memory = createInitialMemory();
      memory.lastSummaryTurn = 5;
      expect(needsSummary(memory, 10)).toBe(false);
    });

    it('returns true when at summary interval', () => {
      const memory = createInitialMemory();
      memory.lastSummaryTurn = 0;
      expect(needsSummary(memory, 10)).toBe(true);
    });

    it('returns true when past summary interval', () => {
      const memory = createInitialMemory();
      memory.lastSummaryTurn = 0;
      expect(needsSummary(memory, 15)).toBe(true);
    });
  });

  describe('updateSummary', () => {
    it('updates summary and turn', () => {
      const memory = createInitialMemory();
      const result = updateSummary(memory, 'The hero defeated a dragon.', 10);
      
      expect(result.lastSummary).toBe('The hero defeated a dragon.');
      expect(result.lastSummaryTurn).toBe(10);
    });
  });

  describe('getRelevantContext', () => {
    it('returns empty context for new game', () => {
      const memory = createInitialMemory();
      const context = getRelevantContext(memory);
      
      expect(context).toContain('WORLD: Unknown');
      expect(context).toContain('LOCATION: Divine Realm');
    });

    it('includes character info when available', () => {
      const memory = createInitialMemory();
      memory.character = {
        name: 'Aria',
        class: 'Mage',
        cheatSkill: 'Time Stop',
        visualTags: ['silver hair', 'purple eyes'],
        createdAt: Date.now(),
      };

      const context = getRelevantContext(memory);
      expect(context).toContain('PLAYER: Aria');
      expect(context).toContain('Mage');
      expect(context).toContain('Time Stop');
      expect(context).toContain('silver hair');
    });

    it('includes known NPCs', () => {
      const memory = createInitialMemory();
      memory.world.knownNPCs = [{
        id: 'npc_1',
        name: 'Bob',
        visualTags: [],
        relationship: 'friendly',
        lastSeenLocation: 'Market',
        notes: [],
      }];

      const context = getRelevantContext(memory);
      expect(context).toContain('Bob');
      expect(context).toContain('friendly');
    });

    it('includes story summary', () => {
      const memory = createInitialMemory();
      memory.lastSummary = 'The hero began their journey.';

      const context = getRelevantContext(memory);
      expect(context).toContain('STORY SO FAR: The hero began their journey.');
    });

    it('includes recent non-low importance events', () => {
      const memory = createInitialMemory();
      memory.eventLog = [
        {
          id: 'evt_1',
          turn: 1,
          timestamp: Date.now(),
          type: 'story',
          summary: 'Low importance event',
          importance: 'low',
        },
        {
          id: 'evt_2',
          turn: 2,
          timestamp: Date.now(),
          type: 'combat',
          summary: 'Fought a dragon',
          importance: 'high',
        },
      ];

      const context = getRelevantContext(memory);
      expect(context).toContain('Fought a dragon');
      expect(context).not.toContain('Low importance event');
    });
  });
});

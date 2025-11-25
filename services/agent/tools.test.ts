import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAgentTools } from './tools';
import { GameMemory, EventLogEntry } from './types';
import { GameStatus, Quest, QuestStatus, QuestType } from '@/types';
import { createInitialMemory } from './memory';

describe('createAgentTools', () => {
  let memory: GameMemory;
  let status: GameStatus | null;
  let quests: Quest[];
  let tools: ReturnType<typeof createAgentTools>;

  const resetState = () => {
    memory = createInitialMemory();
    status = {
      hp: '100/100',
      location: 'Starting Town',
      inventory: ['Sword', 'Potion'],
      skills: ['Slash'],
      activeQuest: '',
      currency: { gold: 50, silver: 0, copper: 0 },
    };
    quests = [];
  };

  beforeEach(() => {
    resetState();
    
    tools = createAgentTools(
      () => memory,
      () => status,
      () => quests,
      (updates) => { memory = { ...memory, ...updates }; },
      (updates) => { 
        status = status ? { ...status, ...updates } : updates as GameStatus; 
      },
      (newQuests) => { quests = newQuests; }
    );
  });

  describe('recallMemory', () => {
    it('returns no memories when empty', async () => {
      const result = await tools.recallMemory.execute(
        { query: 'dragon', type: 'all' },
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toBe('No matching memories found.');
    });

    it('finds matching events', async () => {
      memory.eventLog = [{
        id: 'evt_1',
        turn: 1,
        timestamp: Date.now(),
        type: 'combat',
        summary: 'Fought a dragon in the cave',
        importance: 'high',
      }];

      const result = await tools.recallMemory.execute(
        { query: 'dragon', type: 'events' },
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toContain('Fought a dragon');
    });

    it('finds matching NPCs', async () => {
      memory.world.knownNPCs = [{
        id: 'npc_1',
        name: 'Bob the Merchant',
        visualTags: ['fat', 'bald'],
        relationship: 'friendly',
        lastSeenLocation: 'Market',
        notes: ['Sells potions'],
      }];

      const result = await tools.recallMemory.execute(
        { query: 'bob', type: 'npcs' },
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toContain('Bob the Merchant');
      expect(result).toContain('friendly');
    });

    it('finds visited locations', async () => {
      memory.world.visitedLocations = ['Divine Realm', 'Dark Forest', 'Castle'];

      const result = await tools.recallMemory.execute(
        { query: 'forest', type: 'locations' },
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toContain('Dark Forest');
    });
  });

  describe('logEvent', () => {
    it('adds event to memory', async () => {
      const result = await tools.logEvent.execute(
        {
          summary: 'Defeated the goblin king',
          type: 'combat',
          importance: 'high',
          turn: 5,
        },
        { toolCallId: 'test', messages: [] }
      );

      expect(result).toContain('Event logged');
      expect(memory.eventLog).toHaveLength(1);
      expect(memory.eventLog[0].summary).toBe('Defeated the goblin king');
    });

    it('limits event log to 100 entries', async () => {
      memory.eventLog = Array.from({ length: 100 }, (_, i) => ({
        id: `evt_${i}`,
        turn: i,
        timestamp: Date.now(),
        type: 'story' as const,
        summary: `Event ${i}`,
        importance: 'low' as const,
      }));

      await tools.logEvent.execute(
        {
          summary: 'New event',
          type: 'story',
          importance: 'low',
          turn: 101,
        },
        { toolCallId: 'test', messages: [] }
      );

      expect(memory.eventLog.length).toBeLessThanOrEqual(100);
    });
  });

  describe('checkInventory', () => {
    it('returns inventory items', async () => {
      const result = await tools.checkInventory.execute(
        {},
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toContain('Sword');
      expect(result).toContain('Potion');
    });

    it('returns empty message when no items', async () => {
      status!.inventory = [];
      const result = await tools.checkInventory.execute(
        {},
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toBe('Inventory is empty.');
    });

    it('handles null status', async () => {
      status = null;
      const result = await tools.checkInventory.execute(
        {},
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toBe('Inventory is empty.');
    });
  });

  describe('modifyInventory', () => {
    it('adds items to inventory', async () => {
      const result = await tools.modifyInventory.execute(
        { action: 'add', items: ['Shield', 'Helmet'] },
        { toolCallId: 'test', messages: [] }
      );

      expect(result).toContain('Added');
      expect(status!.inventory).toContain('Shield');
      expect(status!.inventory).toContain('Helmet');
    });

    it('removes items from inventory', async () => {
      const result = await tools.modifyInventory.execute(
        { action: 'remove', items: ['Sword'] },
        { toolCallId: 'test', messages: [] }
      );

      expect(result).toContain('Removed');
      expect(status!.inventory).not.toContain('Sword');
    });

    it('handles case-insensitive removal', async () => {
      await tools.modifyInventory.execute(
        { action: 'remove', items: ['SWORD'] },
        { toolCallId: 'test', messages: [] }
      );

      expect(status!.inventory).not.toContain('Sword');
    });

    it('returns message when items not found', async () => {
      const result = await tools.modifyInventory.execute(
        { action: 'remove', items: ['NonexistentItem'] },
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toBe('Items not found.');
    });

    it('handles null status', async () => {
      status = null;
      const result = await tools.modifyInventory.execute(
        { action: 'add', items: ['Shield'] },
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toBe('No active game status.');
    });
  });

  describe('updatePlayerStatus', () => {
    it('updates HP', async () => {
      await tools.updatePlayerStatus.execute(
        { hp: '80/100' },
        { toolCallId: 'test', messages: [] }
      );
      expect(status!.hp).toBe('80/100');
    });

    it('updates location and adds to visited', async () => {
      await tools.updatePlayerStatus.execute(
        { location: 'Dark Forest' },
        { toolCallId: 'test', messages: [] }
      );

      expect(status!.location).toBe('Dark Forest');
      expect(memory.world.currentLocation).toBe('Dark Forest');
      expect(memory.world.visitedLocations).toContain('Dark Forest');
    });

    it('does not duplicate visited locations', async () => {
      memory.world.visitedLocations = ['Starting Town'];
      
      await tools.updatePlayerStatus.execute(
        { location: 'Starting Town' },
        { toolCallId: 'test', messages: [] }
      );

      expect(memory.world.visitedLocations.filter(l => l === 'Starting Town')).toHaveLength(1);
    });

    it('updates currency', async () => {
      await tools.updatePlayerStatus.execute(
        { gold: 100, silver: 50 },
        { toolCallId: 'test', messages: [] }
      );

      expect(status!.currency.gold).toBe(100);
      expect(status!.currency.silver).toBe(50);
      expect(status!.currency.copper).toBe(0);
    });

    it('handles null status', async () => {
      status = null;
      const result = await tools.updatePlayerStatus.execute(
        { hp: '80/100' },
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toBe('No active game status.');
    });
  });

  describe('getActiveQuest', () => {
    it('returns no quest message when empty', async () => {
      const result = await tools.getActiveQuest.execute(
        {},
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toBe('No active quest.');
    });

    it('returns active quest details', async () => {
      quests = [{
        id: 'quest_1',
        title: 'Slay the Dragon',
        description: 'Defeat the dragon terrorizing the village',
        type: QuestType.Main,
        status: QuestStatus.Active,
        objectives: [
          { id: 'obj_1', description: 'Find the cave', isCompleted: true },
          { id: 'obj_2', description: 'Defeat dragon', isCompleted: false },
        ],
        startedAt: Date.now(),
      }];

      const result = await tools.getActiveQuest.execute(
        {},
        { toolCallId: 'test', messages: [] }
      );

      expect(result).toContain('Slay the Dragon');
      expect(result).toContain('1/2');
    });
  });

  describe('updateQuest', () => {
    it('creates a new quest', async () => {
      const result = await tools.updateQuest.execute(
        {
          action: 'create',
          title: 'Find the Artifact',
          description: 'Locate the ancient artifact',
          objectives: ['Travel to ruins', 'Solve puzzle', 'Retrieve artifact'],
        },
        { toolCallId: 'test', messages: [] }
      );

      expect(result).toContain('Quest created');
      expect(quests).toHaveLength(1);
      expect(quests[0].title).toBe('Find the Artifact');
      expect(quests[0].objectives).toHaveLength(3);
    });

    it('completes a quest objective', async () => {
      quests = [{
        id: 'quest_1',
        title: 'Test Quest',
        description: 'Test',
        type: QuestType.Main,
        status: QuestStatus.Active,
        objectives: [
          { id: 'obj_0', description: 'Step 1', isCompleted: false },
        ],
        startedAt: Date.now(),
      }];

      await tools.updateQuest.execute(
        {
          action: 'complete_objective',
          questId: 'quest_1',
          objectiveId: 'obj_0',
        },
        { toolCallId: 'test', messages: [] }
      );

      expect(quests[0].objectives[0].isCompleted).toBe(true);
    });

    it('completes a quest', async () => {
      quests = [{
        id: 'quest_1',
        title: 'Test Quest',
        description: 'Test',
        type: QuestType.Main,
        status: QuestStatus.Active,
        objectives: [],
        startedAt: Date.now(),
      }];

      await tools.updateQuest.execute(
        { action: 'complete_quest', questId: 'quest_1' },
        { toolCallId: 'test', messages: [] }
      );

      expect(quests[0].status).toBe(QuestStatus.Completed);
      expect(quests[0].completedAt).toBeDefined();
    });

    it('fails a quest', async () => {
      quests = [{
        id: 'quest_1',
        title: 'Test Quest',
        description: 'Test',
        type: QuestType.Main,
        status: QuestStatus.Active,
        objectives: [],
        startedAt: Date.now(),
      }];

      await tools.updateQuest.execute(
        { action: 'fail_quest', questId: 'quest_1' },
        { toolCallId: 'test', messages: [] }
      );

      expect(quests[0].status).toBe(QuestStatus.Failed);
    });

    it('returns error for non-existent quest', async () => {
      const result = await tools.updateQuest.execute(
        { action: 'complete_quest', questId: 'nonexistent' },
        { toolCallId: 'test', messages: [] }
      );
      expect(result).toBe('Quest not found.');
    });
  });

  describe('registerNPC', () => {
    it('registers a new NPC', async () => {
      const result = await tools.registerNPC.execute(
        {
          id: 'npc_1',
          name: 'Gandalf',
          visualTags: ['grey robes', 'long beard', 'staff'],
          relationship: 'ally',
          location: 'Wizard Tower',
          note: 'Gave us a quest',
        },
        { toolCallId: 'test', messages: [] }
      );

      expect(result).toContain('NPC registered');
      expect(memory.world.knownNPCs).toHaveLength(1);
      expect(memory.world.knownNPCs[0].name).toBe('Gandalf');
    });

    it('updates existing NPC and merges visual tags', async () => {
      memory.world.knownNPCs = [{
        id: 'npc_1',
        name: 'Gandalf',
        visualTags: ['grey robes'],
        relationship: 'neutral',
        lastSeenLocation: 'Inn',
        notes: ['Met at inn'],
      }];

      await tools.registerNPC.execute(
        {
          id: 'npc_1',
          name: 'Gandalf',
          visualTags: ['long beard', 'grey robes'],
          relationship: 'ally',
          location: 'Wizard Tower',
          note: 'Now our ally',
        },
        { toolCallId: 'test', messages: [] }
      );

      expect(memory.world.knownNPCs).toHaveLength(1);
      expect(memory.world.knownNPCs[0].relationship).toBe('ally');
      expect(memory.world.knownNPCs[0].visualTags).toContain('grey robes');
      expect(memory.world.knownNPCs[0].visualTags).toContain('long beard');
      expect(memory.world.knownNPCs[0].notes).toHaveLength(2);
    });
  });

  describe('setCharacterProfile', () => {
    it('sets character profile', async () => {
      const result = await tools.setCharacterProfile.execute(
        {
          name: 'Aria',
          class: 'Mage',
          cheatSkill: 'Time Stop',
          visualTags: ['silver hair', 'purple eyes', 'flowing robes'],
        },
        { toolCallId: 'test', messages: [] }
      );

      expect(result).toContain('Character created');
      expect(memory.character).not.toBeNull();
      expect(memory.character!.name).toBe('Aria');
      expect(memory.character!.class).toBe('Mage');
      expect(memory.character!.cheatSkill).toBe('Time Stop');
    });
  });
});

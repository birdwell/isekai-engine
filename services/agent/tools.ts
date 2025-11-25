import { tool } from 'ai';
import { z } from 'zod';
import { GameMemory, EventLogEntry } from './types';
import { GameStatus, Quest, QuestStatus, QuestType } from '@/types';

export const createAgentTools = (
  getMemory: () => GameMemory,
  getStatus: () => GameStatus | null,
  getQuests: () => Quest[],
  updateMemory: (updates: Partial<GameMemory>) => void,
  updateStatus: (status: Partial<GameStatus>) => void,
  updateQuests: (quests: Quest[]) => void
) => ({
  
  recallMemory: tool({
    description: 'Recall relevant information from long-term memory. Use this to remember past events, NPCs, locations, or story details.',
    inputSchema: z.object({
      query: z.string().describe('What to search for in memory (e.g., "dragon encounter", "merchant named Bob")'),
      type: z.enum(['events', 'npcs', 'locations', 'all']).default('all'),
    }),
    execute: async ({ query, type }) => {
      const memory = getMemory();
      const results: string[] = [];
      const queryLower = query.toLowerCase();

      if (type === 'all' || type === 'events') {
        const matchingEvents = memory.eventLog
          .filter(e => e.summary.toLowerCase().includes(queryLower))
          .slice(-5)
          .map(e => `[Turn ${e.turn}] ${e.summary}`);
        if (matchingEvents.length) {
          results.push(`Events: ${matchingEvents.join('; ')}`);
        }
      }

      if (type === 'all' || type === 'npcs') {
        const matchingNPCs = memory.world.knownNPCs
          .filter(n => n.name.toLowerCase().includes(queryLower) || 
                       n.notes.some(note => note.toLowerCase().includes(queryLower)))
          .map(n => `${n.name} (${n.relationship}) at ${n.lastSeenLocation}`);
        if (matchingNPCs.length) {
          results.push(`NPCs: ${matchingNPCs.join('; ')}`);
        }
      }

      if (type === 'all' || type === 'locations') {
        const matchingLocations = memory.world.visitedLocations
          .filter(l => l.toLowerCase().includes(queryLower));
        if (matchingLocations.length) {
          results.push(`Visited: ${matchingLocations.join(', ')}`);
        }
      }

      return results.length ? results.join('\n') : 'No matching memories found.';
    },
  }),

  logEvent: tool({
    description: 'Record an important story event to long-term memory. Use for significant plot points, discoveries, or character moments.',
    inputSchema: z.object({
      summary: z.string().describe('Brief summary of the event (1-2 sentences)'),
      type: z.enum(['story', 'combat', 'quest', 'discovery', 'dialogue']),
      importance: z.enum(['low', 'medium', 'high', 'critical']),
      turn: z.number().describe('Current turn number'),
    }),
    execute: async ({ summary, type, importance, turn }) => {
      const memory = getMemory();
      const newEvent: EventLogEntry = {
        id: `evt_${Date.now()}`,
        turn,
        timestamp: Date.now(),
        summary,
        type,
        importance,
      };
      updateMemory({
        eventLog: [...memory.eventLog, newEvent].slice(-100),
      });
      return `Event logged: ${summary}`;
    },
  }),

  checkInventory: tool({
    description: 'Check what items the player currently has in their inventory.',
    inputSchema: z.object({}),
    execute: async () => {
      const status = getStatus();
      if (!status?.inventory?.length) {
        return 'Inventory is empty.';
      }
      return `Inventory: ${status.inventory.join(', ')}`;
    },
  }),

  modifyInventory: tool({
    description: 'Add or remove items from the player inventory.',
    inputSchema: z.object({
      action: z.enum(['add', 'remove']),
      items: z.array(z.string()).describe('Items to add or remove'),
    }),
    execute: async ({ action, items }) => {
      const status = getStatus();
      if (!status) return 'No active game status.';

      let inventory = [...(status.inventory || [])];
      
      if (action === 'add') {
        inventory = [...inventory, ...items];
        updateStatus({ inventory });
        return `Added to inventory: ${items.join(', ')}`;
      } else {
        const removed: string[] = [];
        items.forEach(item => {
          const idx = inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
          if (idx >= 0) {
            removed.push(inventory[idx]);
            inventory.splice(idx, 1);
          }
        });
        updateStatus({ inventory });
        return removed.length ? `Removed: ${removed.join(', ')}` : 'Items not found.';
      }
    },
  }),

  updatePlayerStatus: tool({
    description: 'Update player HP, location, or currency.',
    inputSchema: z.object({
      hp: z.string().optional().describe('New HP value like "95/100"'),
      location: z.string().optional().describe('New location name'),
      gold: z.number().optional(),
      silver: z.number().optional(),
      copper: z.number().optional(),
    }),
    execute: async ({ hp, location, gold, silver, copper }) => {
      const status = getStatus();
      if (!status) return 'No active game status.';

      const updates: Partial<GameStatus> = {};
      if (hp) updates.hp = hp;
      if (location) {
        updates.location = location;
        const memory = getMemory();
        updateMemory({
          world: {
            ...memory.world,
            currentLocation: location,
            visitedLocations: memory.world.visitedLocations.includes(location)
              ? memory.world.visitedLocations
              : [...memory.world.visitedLocations, location],
          },
        });
      }
      if (gold !== undefined || silver !== undefined || copper !== undefined) {
        updates.currency = {
          gold: gold ?? status.currency.gold,
          silver: silver ?? status.currency.silver,
          copper: copper ?? status.currency.copper,
        };
      }

      updateStatus(updates);
      return `Status updated: ${JSON.stringify(updates)}`;
    },
  }),

  getActiveQuest: tool({
    description: 'Get details about the current active quest.',
    inputSchema: z.object({}),
    execute: async () => {
      const quests = getQuests();
      const active = quests.find(q => q.status === QuestStatus.Active);
      if (!active) return 'No active quest.';
      
      const completed = active.objectives.filter(o => o.isCompleted).length;
      const total = active.objectives.length;
      return `Quest: ${active.title}\n${active.description}\nProgress: ${completed}/${total} objectives`;
    },
  }),

  updateQuest: tool({
    description: 'Create a new quest or update an existing quest objective.',
    inputSchema: z.object({
      action: z.enum(['create', 'complete_objective', 'complete_quest', 'fail_quest']),
      questId: z.string().optional().describe('Quest ID for updates'),
      title: z.string().optional().describe('Quest title for new quests'),
      description: z.string().optional().describe('Quest description'),
      objectives: z.array(z.string()).optional().describe('Objective descriptions for new quests'),
      objectiveId: z.string().optional().describe('Objective ID to mark complete'),
    }),
    execute: async ({ action, questId, title, description, objectives, objectiveId }) => {
      const quests = getQuests();

      if (action === 'create' && title && description) {
        const newQuest: Quest = {
          id: `quest_${Date.now()}`,
          title,
          description,
          type: QuestType.Main,
          status: QuestStatus.Active,
          objectives: (objectives || []).map((desc, i) => ({
            id: `obj_${i}`,
            description: desc,
            isCompleted: false,
          })),
          startedAt: Date.now(),
        };
        updateQuests([...quests, newQuest]);
        return `Quest created: ${title}`;
      }

      if (questId) {
        const idx = quests.findIndex(q => q.id === questId);
        if (idx < 0) return 'Quest not found.';

        const quest = { ...quests[idx] };

        if (action === 'complete_objective' && objectiveId) {
          quest.objectives = quest.objectives.map(o =>
            o.id === objectiveId ? { ...o, isCompleted: true } : o
          );
        } else if (action === 'complete_quest') {
          quest.status = QuestStatus.Completed;
          quest.completedAt = Date.now();
        } else if (action === 'fail_quest') {
          quest.status = QuestStatus.Failed;
        }

        const updated = [...quests];
        updated[idx] = quest;
        updateQuests(updated);
        return `Quest updated: ${quest.title}`;
      }

      return 'Invalid quest operation.';
    },
  }),

  registerNPC: tool({
    description: 'Register or update an NPC in memory for consistent characterization.',
    inputSchema: z.object({
      id: z.string().describe('Unique NPC identifier'),
      name: z.string(),
      visualTags: z.array(z.string()).describe('Visual description tags for consistent art'),
      relationship: z.enum(['hostile', 'neutral', 'friendly', 'ally']),
      location: z.string(),
      note: z.string().optional().describe('Additional note about this NPC'),
    }),
    execute: async ({ id, name, visualTags, relationship, location, note }) => {
      const memory = getMemory();
      const existing = memory.world.knownNPCs.find(n => n.id === id);
      
      const npc = {
        id,
        name,
        visualTags: existing ? [...new Set([...existing.visualTags, ...visualTags])] : visualTags,
        relationship,
        lastSeenLocation: location,
        notes: note 
          ? [...(existing?.notes || []), note]
          : (existing?.notes || []),
      };

      const updatedNPCs = existing
        ? memory.world.knownNPCs.map(n => n.id === id ? npc : n)
        : [...memory.world.knownNPCs, npc];

      updateMemory({
        world: { ...memory.world, knownNPCs: updatedNPCs },
      });

      return `NPC registered: ${name} (${relationship})`;
    },
  }),

  setCharacterProfile: tool({
    description: 'Set or update the player character profile. Use during character creation.',
    inputSchema: z.object({
      name: z.string(),
      class: z.string(),
      cheatSkill: z.string(),
      visualTags: z.array(z.string()).describe('Visual tags for consistent art (hair, clothing, features)'),
    }),
    execute: async ({ name, class: charClass, cheatSkill, visualTags }) => {
      updateMemory({
        character: {
          name,
          class: charClass,
          cheatSkill,
          visualTags,
          createdAt: Date.now(),
        },
      });
      return `Character created: ${name} the ${charClass} with ${cheatSkill}`;
    },
  }),
});

export type AgentTools = ReturnType<typeof createAgentTools>;

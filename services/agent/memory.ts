import { GameMemory, EventLogEntry, CharacterProfile, NPCProfile } from './types';

const MEMORY_KEY = 'isekai_agent_memory';
const MAX_EVENT_LOG_SIZE = 100;
const SUMMARY_INTERVAL = 10;

export const createInitialMemory = (): GameMemory => ({
  character: null,
  world: {
    worldType: '',
    currentLocation: 'Divine Realm',
    visitedLocations: ['Divine Realm'],
    knownNPCs: [],
    globalFlags: {},
  },
  eventLog: [],
  lastSummary: '',
  lastSummaryTurn: 0,
});

export const saveMemory = (memory: GameMemory): void => {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error('Failed to save memory:', e);
  }
};

export const loadMemory = (): GameMemory | null => {
  try {
    const saved = localStorage.getItem(MEMORY_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load memory:', e);
  }
  return null;
};

export const clearMemory = (): void => {
  localStorage.removeItem(MEMORY_KEY);
};

export const addEventToLog = (
  memory: GameMemory,
  event: Omit<EventLogEntry, 'id' | 'timestamp'>
): GameMemory => {
  const newEvent: EventLogEntry = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  const updatedLog = [...memory.eventLog, newEvent];
  
  if (updatedLog.length > MAX_EVENT_LOG_SIZE) {
    const criticalEvents = updatedLog.filter(e => e.importance === 'critical');
    const recentEvents = updatedLog.slice(-50);
    const combined = [...new Set([...criticalEvents, ...recentEvents])];
    combined.sort((a, b) => a.turn - b.turn);
    return { ...memory, eventLog: combined };
  }

  return { ...memory, eventLog: updatedLog };
};

export const setCharacter = (
  memory: GameMemory,
  character: CharacterProfile
): GameMemory => ({
  ...memory,
  character,
});

export const updateLocation = (
  memory: GameMemory,
  location: string
): GameMemory => ({
  ...memory,
  world: {
    ...memory.world,
    currentLocation: location,
    visitedLocations: memory.world.visitedLocations.includes(location)
      ? memory.world.visitedLocations
      : [...memory.world.visitedLocations, location],
  },
});

export const addOrUpdateNPC = (
  memory: GameMemory,
  npc: NPCProfile
): GameMemory => {
  const existingIndex = memory.world.knownNPCs.findIndex(n => n.id === npc.id);
  const updatedNPCs = existingIndex >= 0
    ? memory.world.knownNPCs.map((n, i) => i === existingIndex ? npc : n)
    : [...memory.world.knownNPCs, npc];

  return {
    ...memory,
    world: { ...memory.world, knownNPCs: updatedNPCs },
  };
};

export const needsSummary = (memory: GameMemory, currentTurn: number): boolean => {
  return currentTurn - memory.lastSummaryTurn >= SUMMARY_INTERVAL;
};

export const updateSummary = (
  memory: GameMemory,
  summary: string,
  turn: number
): GameMemory => ({
  ...memory,
  lastSummary: summary,
  lastSummaryTurn: turn,
});

export const getRelevantContext = (memory: GameMemory): string => {
  const parts: string[] = [];

  if (memory.character) {
    parts.push(`PLAYER: ${memory.character.name}, ${memory.character.class}, Skill: ${memory.character.cheatSkill}`);
    parts.push(`VISUAL TAGS: ${memory.character.visualTags.join(', ')}`);
  }

  parts.push(`WORLD: ${memory.world.worldType || 'Unknown'}`);
  parts.push(`LOCATION: ${memory.world.currentLocation}`);

  if (memory.world.knownNPCs.length > 0) {
    const npcList = memory.world.knownNPCs
      .slice(-5)
      .map(n => `${n.name} (${n.relationship})`)
      .join(', ');
    parts.push(`KNOWN NPCs: ${npcList}`);
  }

  if (memory.lastSummary) {
    parts.push(`STORY SO FAR: ${memory.lastSummary}`);
  }

  const recentEvents = memory.eventLog
    .filter(e => e.importance !== 'low')
    .slice(-10)
    .map(e => `- ${e.summary}`)
    .join('\n');

  if (recentEvents) {
    parts.push(`RECENT EVENTS:\n${recentEvents}`);
  }

  return parts.join('\n');
};

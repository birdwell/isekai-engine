import { GameStatus, Quest, MediaItem } from '@/types';

export interface CharacterProfile {
  name: string;
  class: string;
  cheatSkill: string;
  visualTags: string[];
  createdAt: number;
}

export interface WorldState {
  worldType: string;
  currentLocation: string;
  visitedLocations: string[];
  knownNPCs: NPCProfile[];
  globalFlags: Record<string, boolean>;
}

export interface NPCProfile {
  id: string;
  name: string;
  visualTags: string[];
  relationship: 'hostile' | 'neutral' | 'friendly' | 'ally';
  lastSeenLocation: string;
  notes: string[];
}

export interface EventLogEntry {
  id: string;
  turn: number;
  timestamp: number;
  type: 'story' | 'combat' | 'quest' | 'discovery' | 'dialogue';
  summary: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface GameMemory {
  character: CharacterProfile | null;
  world: WorldState;
  eventLog: EventLogEntry[];
  lastSummary: string;
  lastSummaryTurn: number;
}

export interface AgentContext {
  memory: GameMemory;
  currentStatus: GameStatus | null;
  quests: Quest[];
  recentHistory: string[];
  turnCount: number;
}

export interface AgentResponse {
  scenePrompt: string;
  narrative: string;
  status: GameStatus;
  choices: { id: string; text: string }[];
  memoryUpdates?: Partial<GameMemory>;
}

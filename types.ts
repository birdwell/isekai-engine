
export interface Currency {
  gold: number;
  silver: number;
  copper: number;
}

export enum QuestStatus {
  Active = 'active',
  Completed = 'completed',
  Failed = 'failed',
  Hidden = 'hidden'
}

export enum QuestType {
  Main = 'main',
  Side = 'side',
  Hidden = 'hidden'
}

export interface QuestObjective {
  id: string;
  description: string;
  isCompleted: boolean;
  isOptional?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards?: string[];
  startedAt: number;
  completedAt?: number;
}

export interface QuestState {
  quests: Quest[];
  activeQuestId: string | null;
}

export interface GameStatus {
  hp: string;
  location: string;
  inventory: string[];
  skills: string[];
  activeQuest: string;
  currency: Currency;
}

export interface GameResponse {
  scenePrompt: string;
  narrative: string;
  status: GameStatus | null;
  choices: Choice[];
  rawText: string;
}

export interface Choice {
  id: string;
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MediaItem {
  id: string; // unique ID for key
  url: string;
  videoUrl: string | null;
  prompt: string;
  timestamp: number;
}

export enum GamePhase {
  Initializing,
  Playing,
  Error
}

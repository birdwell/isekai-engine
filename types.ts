
export interface Currency {
  gold: number;
  silver: number;
  copper: number;
}

export interface GameStatus {
  hp: string;
  location: string;
  inventory: string[];
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

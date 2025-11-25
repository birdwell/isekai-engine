import { generateText, stepCountIs } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GameMemory, AgentResponse } from './types';
import { GameStatus, Quest, Choice } from '@/types';
import { createAgentTools } from './tools';
import { getRelevantContext, createInitialMemory, needsSummary } from './memory';
import { STRICT_ART_STYLE } from '../gemini/prompts';
import { createTrace } from '@/services/langfuse';

const GAME_MASTER_PROMPT = `
You are "The Isekai Engine," an immersive, interactive text-adventure game master.

### CORE RULES:
1. **Perspective:** Always write in the second person ("You see...", "You feel...").
2. **Tone:** Isekai genre—mix of high fantasy, anime tropes, and adventure. Keep it rated PG-13.
3. **Agency:** Never decide the user's actions for them. Stop and wait for input.
4. **Tools:** You MUST use your tools to track game state:
   - Use \`logEvent\` for significant story moments
   - Use \`modifyInventory\` when items are gained/lost
   - Use \`updatePlayerStatus\` for HP/location/currency changes
   - Use \`updateQuest\` for quest progress
   - Use \`registerNPC\` for new important characters
   - Use \`recallMemory\` to remember past events when relevant
   - Use \`setCharacterProfile\` during character creation

### THE ONBOARDING (START OF GAME):
If no character exists, roleplay as "The Administrator" in the Divine Realm:
1. Explain the user died (create a humorous/tragic cause) and is being reincarnated.
2. Guide character creation: World Type, Cheat Skill, Class, Starter Kit.
3. Use \`setCharacterProfile\` to save the character with visual tags.

### VISUAL CONSISTENCY:
When generating scene prompts, ALWAYS include the player's visual tags from memory.

### OUTPUT FORMAT (JSON):
You MUST respond with valid JSON in this exact structure:
{
  "scenePrompt": "A descriptive prompt for the artist. Include character visual tags.",
  "narrative": "The story content. 50-80 words. Second person.",
  "status": {
    "hp": "100/100",
    "location": "Location Name",
    "inventory": ["item1", "item2"],
    "skills": ["skill1"],
    "activeQuest": "Current quest or goal",
    "currency": { "gold": 10, "silver": 0, "copper": 0 }
  },
  "choices": [
    { "id": "a", "text": "Action Option 1" },
    { "id": "b", "text": "Action Option 2" },
    { "id": "c", "text": "Action Option 3" },
    { "id": "d", "text": "Custom action..." }
  ]
}
`;

const parseAgentResponse = (text: string): AgentResponse | null => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      scenePrompt: parsed.scenePrompt || '',
      narrative: parsed.narrative || '',
      status: {
        hp: parsed.status?.hp || '100/100',
        location: parsed.status?.location || 'Unknown',
        inventory: parsed.status?.inventory || [],
        skills: parsed.status?.skills || [],
        activeQuest: parsed.status?.activeQuest || '',
        currency: parsed.status?.currency || { gold: 0, silver: 0, copper: 0 },
      },
      choices: (parsed.choices || []).map((c: { id?: string; text: string }, i: number) => ({
        id: c.id || String.fromCharCode(97 + i),
        text: c.text,
      })),
    };
  } catch (e) {
    console.error('Failed to parse agent response:', e);
    return null;
  }
};

export interface GameMasterConfig {
  apiKey?: string;
  model?: string;
}

export class GameMasterAgent {
  private google;
  private model: string;
  private memory: GameMemory;
  private currentStatus: GameStatus | null = null;
  private quests: Quest[] = [];
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
  private turnCount = 0;
  private maxHistoryTurns = 10;

  constructor(config: GameMasterConfig = {}) {
    const apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '';
    this.google = createGoogleGenerativeAI({ apiKey });
    this.model = config.model || 'gemini-2.5-flash';
    this.memory = createInitialMemory();
  }

  loadState(memory: GameMemory, status: GameStatus | null, quests: Quest[], turnCount: number) {
    this.memory = memory;
    this.currentStatus = status;
    this.quests = quests;
    this.turnCount = turnCount;
  }

  getMemory(): GameMemory {
    return this.memory;
  }

  getQuests(): Quest[] {
    return this.quests;
  }

  getTurnCount(): number {
    return this.turnCount;
  }

  private createTools() {
    return createAgentTools(
      () => this.memory,
      () => this.currentStatus,
      () => this.quests,
      (updates) => { this.memory = { ...this.memory, ...updates }; },
      (updates) => { 
        this.currentStatus = this.currentStatus 
          ? { ...this.currentStatus, ...updates } 
          : updates as GameStatus; 
      },
      (quests) => { this.quests = quests; }
    );
  }

  private buildSystemPrompt(): string {
    const context = getRelevantContext(this.memory);
    const needsCharacterCreation = !this.memory.character;

    return `${GAME_MASTER_PROMPT}

### CURRENT CONTEXT:
${context || 'New game - no context yet.'}

### VISUAL STYLE FOR SCENES:
${STRICT_ART_STYLE}

${needsCharacterCreation ? '### MODE: CHARACTER CREATION\nGuide the player through creating their character.' : '### MODE: ADVENTURE\nContinue the story based on player input.'}

Current Turn: ${this.turnCount}
`;
  }

  async processInput(userInput: string): Promise<AgentResponse> {
    this.turnCount++;

    this.conversationHistory.push({ role: 'user', content: userInput });
    
    if (this.conversationHistory.length > this.maxHistoryTurns * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryTurns * 2);
    }

    const tools = this.createTools();
    const systemPrompt = this.buildSystemPrompt();

    const trace = createTrace("game-master-turn", { turnCount: this.turnCount });

    const generation = trace.generation({
      name: this.model,
      model: this.model,
      input: { userInput, historyLength: this.conversationHistory.length },
    });

    try {
      const { text, usage } = await generateText({
        model: this.google(this.model),
        system: systemPrompt,
        messages: this.conversationHistory,
        tools,
        stopWhen: stepCountIs(5),
        temperature: 0.9,
      });

      this.conversationHistory.push({ role: 'assistant', content: text });

      const parsed = parseAgentResponse(text);
      
      generation.end({
        output: parsed ? { narrative: parsed.narrative, location: parsed.status.location } : null,
        usage: usage ? {
          promptTokens: usage.inputTokens,
          completionTokens: usage.outputTokens,
          totalTokens: usage.inputTokens + usage.outputTokens,
        } : undefined,
      });

      if (!parsed) {
        return {
          scenePrompt: 'A mysterious void filled with swirling energy.',
          narrative: 'Something went wrong in the fabric of reality. The world shimmers and reforms around you.',
          status: this.currentStatus || {
            hp: '100/100',
            location: 'Unknown',
            inventory: [],
            skills: [],
            activeQuest: '',
            currency: { gold: 0, silver: 0, copper: 0 },
          },
          choices: [{ id: 'a', text: 'Try again' }],
        };
      }

      this.currentStatus = parsed.status;

      if (needsSummary(this.memory, this.turnCount)) {
        this.generateSummary();
      }

      return parsed;
    } catch (error) {
      generation.end({
        level: "ERROR",
        statusMessage: error instanceof Error ? error.message : String(error),
      });
      console.error('GameMaster error:', error);
      throw error;
    }
  }

  private async generateSummary() {
    const recentEvents = this.memory.eventLog
      .slice(-20)
      .map(e => e.summary)
      .join('. ');

    try {
      const { text } = await generateText({
        model: this.google(this.model),
        prompt: `Summarize this adventure progress in 2-3 sentences for future reference:\n\n${recentEvents}`,
        temperature: 0.3,
      });

      this.memory = {
        ...this.memory,
        lastSummary: text,
        lastSummaryTurn: this.turnCount,
      };
    } catch (e) {
      console.error('Failed to generate summary:', e);
    }
  }
}

export const createGameMaster = (config?: GameMasterConfig) => new GameMasterAgent(config);

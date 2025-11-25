import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockLanguageModelV2 } from 'ai/test';
import { generateText } from 'ai';
import { GameMasterAgent, createGameMaster } from '../gameMaster';
import { createInitialMemory } from '../memory';
import { Quest, QuestStatus, QuestType } from '@/types';

const createMockResponse = (response: {
  scenePrompt?: string;
  narrative?: string;
  status?: Record<string, unknown>;
  choices?: { id: string; text: string }[];
}) => {
  return JSON.stringify({
    scenePrompt: response.scenePrompt || 'A test scene',
    narrative: response.narrative || 'Test narrative',
    status: response.status || {
      hp: '100/100',
      location: 'Test Location',
      inventory: [],
      skills: [],
      activeQuest: '',
      currency: { gold: 0, silver: 0, copper: 0 },
    },
    choices: response.choices || [
      { id: 'a', text: 'Option A' },
      { id: 'b', text: 'Option B' },
    ],
  });
};

const createMockDoGenerate = (text: string) => ({
  finishReason: 'stop' as const,
  usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
  content: [{ type: 'text' as const, text }],
  warnings: [],
});

describe('GameMasterAgent', () => {
  describe('createGameMaster', () => {
    it('creates a new GameMasterAgent instance', () => {
      const agent = createGameMaster();
      expect(agent).toBeInstanceOf(GameMasterAgent);
    });

    it('accepts custom config', () => {
      const agent = createGameMaster({ model: 'gemini-2.0-flash' });
      expect(agent).toBeInstanceOf(GameMasterAgent);
    });
  });

  describe('GameMasterAgent', () => {
    let agent: GameMasterAgent;

    beforeEach(() => {
      agent = new GameMasterAgent();
    });

    describe('initial state', () => {
      it('starts with initial memory', () => {
        const memory = agent.getMemory();
        expect(memory.character).toBeNull();
        expect(memory.world.currentLocation).toBe('Divine Realm');
        expect(memory.eventLog).toEqual([]);
      });

      it('starts with zero turn count', () => {
        expect(agent.getTurnCount()).toBe(0);
      });

      it('starts with empty quests', () => {
        expect(agent.getQuests()).toEqual([]);
      });
    });

    describe('loadState', () => {
      it('loads memory state', () => {
        const memory = createInitialMemory();
        memory.character = {
          name: 'TestHero',
          class: 'Warrior',
          cheatSkill: 'Super Strength',
          visualTags: ['red hair', 'armor'],
          createdAt: Date.now(),
        };

        agent.loadState(memory, null, [], 5);

        expect(agent.getMemory().character?.name).toBe('TestHero');
        expect(agent.getTurnCount()).toBe(5);
      });

      it('loads quests', () => {
        const quests: Quest[] = [
          {
            title: 'Test Quest',
            description: 'A test quest',
            objectives: [],
            startedAt: Date.now(),
            id: '',
            type: QuestType.Main,
            status: QuestStatus.Active
          }];

        agent.loadState(createInitialMemory(), null, quests, 0);

        expect(agent.getQuests()).toHaveLength(1);
        expect(agent.getQuests()[0].title).toBe('Test Quest');
      });
    });
  });
});

describe('MockLanguageModelV2 integration', () => {
  it('can mock generateText', async () => {
    const mockModel = new MockLanguageModelV2({
      doGenerate: async () => createMockDoGenerate(
        createMockResponse({ narrative: 'The adventure begins!' })
      ),
    });

    const result = await generateText({
      model: mockModel,
      prompt: 'Start the adventure',
    });

    expect(result.text).toContain('adventure begins');
  });

  it('parses valid JSON response', async () => {
    const mockModel = new MockLanguageModelV2({
      doGenerate: async () => createMockDoGenerate(
        createMockResponse({
          narrative: 'You stand before a dragon.',
          scenePrompt: 'A hero facing a dragon in a cave',
        })
      ),
    });

    const result = await generateText({
      model: mockModel,
      prompt: 'Test prompt',
    });

    const parsed = JSON.parse(result.text);
    expect(parsed.narrative).toBe('You stand before a dragon.');
    expect(parsed.scenePrompt).toBe('A hero facing a dragon in a cave');
  });

  it('includes default status values', async () => {
    const mockModel = new MockLanguageModelV2({
      doGenerate: async () => createMockDoGenerate(createMockResponse({})),
    });

    const result = await generateText({
      model: mockModel,
      prompt: 'Test prompt',
    });

    const parsed = JSON.parse(result.text);
    expect(parsed.status.hp).toBe('100/100');
    expect(parsed.status.inventory).toEqual([]);
    expect(parsed.status.currency.gold).toBe(0);
  });

  it('parses choices correctly', async () => {
    const mockModel = new MockLanguageModelV2({
      doGenerate: async () => createMockDoGenerate(
        createMockResponse({
          choices: [
            { id: 'a', text: 'Attack!' },
            { id: 'b', text: 'Run away' },
            { id: 'c', text: 'Talk to dragon' },
          ],
        })
      ),
    });

    const result = await generateText({
      model: mockModel,
      prompt: 'Test prompt',
    });

    const parsed = JSON.parse(result.text);
    expect(parsed.choices).toHaveLength(3);
    expect(parsed.choices[0].text).toBe('Attack!');
  });

  it('can simulate multi-step behavior', async () => {
    let callCount = 0;
    
    const mockModel = new MockLanguageModelV2({
      doGenerate: async () => {
        callCount++;
        return createMockDoGenerate(
          createMockResponse({ narrative: `Step ${callCount} complete.` })
        );
      },
    });

    await generateText({ model: mockModel, prompt: 'Step 1' });
    await generateText({ model: mockModel, prompt: 'Step 2' });
    
    expect(callCount).toBe(2);
  });

  it('tracks doGenerate calls', async () => {
    const mockModel = new MockLanguageModelV2({
      doGenerate: async () => createMockDoGenerate(
        createMockResponse({ narrative: 'Test' })
      ),
    });

    await generateText({ model: mockModel, prompt: 'First call' });
    await generateText({ model: mockModel, prompt: 'Second call' });
    
    expect(mockModel.doGenerateCalls).toHaveLength(2);
  });
});

describe('parseAgentResponse edge cases', () => {
  it('handles response with extra whitespace', async () => {
    const mockModel = new MockLanguageModelV2({
      doGenerate: async () => createMockDoGenerate(
        `  \n${createMockResponse({ narrative: 'Test' })}\n  `
      ),
    });

    const result = await generateText({
      model: mockModel,
      prompt: 'Test',
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed.narrative).toBe('Test');
  });

  it('handles response with preamble text', async () => {
    const mockModel = new MockLanguageModelV2({
      doGenerate: async () => createMockDoGenerate(
        `Here is the response:\n${createMockResponse({ narrative: 'Adventure awaits' })}`
      ),
    });

    const result = await generateText({
      model: mockModel,
      prompt: 'Test',
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed.narrative).toBe('Adventure awaits');
  });

  it('handles nested JSON in scenePrompt', async () => {
    const complexResponse = createMockResponse({
      scenePrompt: 'A scene with "quotes" and special chars: {}',
      narrative: 'Test narrative',
    });

    const mockModel = new MockLanguageModelV2({
      doGenerate: async () => createMockDoGenerate(complexResponse),
    });

    const result = await generateText({
      model: mockModel,
      prompt: 'Test',
    });

    const parsed = JSON.parse(result.text);
    expect(parsed.scenePrompt).toContain('quotes');
  });
});

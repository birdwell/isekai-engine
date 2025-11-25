import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';

const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('GameMaster error') ||
        message.includes('Game Turn Error') ||
        message.includes('API_APICallError'))
    ) {
      return;
    }
    if (
      message &&
      typeof message === 'object' &&
      'name' in message &&
      (message as { name: string }).name === 'APICallError'
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

const mockResponseText = JSON.stringify({
  scenePrompt: 'A mystical realm',
  narrative: 'Your adventure begins.',
  status: {
    hp: '100/100',
    location: 'Divine Realm',
    inventory: [],
    skills: [],
    activeQuest: '',
    currency: { gold: 0, silver: 0, copper: 0 },
  },
  choices: [
    { id: 'a', text: 'Continue' },
    { id: 'b', text: 'Look around' },
  ],
});

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => ({
    specificationVersion: 'v1',
    provider: 'google',
    modelId: 'gemini-2.5-flash',
    defaultObjectGenerationMode: 'json',
    doGenerate: vi.fn().mockResolvedValue({
      text: mockResponseText,
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  }))),
}));

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  
  return {
    ...actual,
    generateText: vi.fn().mockImplementation(async (options) => {
      if (options.model?.constructor?.name === 'MockLanguageModelV2') {
        return actual.generateText(options);
      }
      return {
        text: mockResponseText,
        toolCalls: [],
        toolResults: [],
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 },
      };
    }),
  };
});

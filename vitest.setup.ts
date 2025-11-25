import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return {
    ...actual,
    generateText: vi.fn().mockResolvedValue({
      text: JSON.stringify({
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
      }),
      toolCalls: [],
      toolResults: [],
      finishReason: 'stop',
      usage: { promptTokens: 100, completionTokens: 50 },
    }),
  };
});

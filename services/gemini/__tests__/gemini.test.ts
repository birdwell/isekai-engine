import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatMessage } from '@/types';

const mockGenerateContent = vi.fn();
const mockGenerateVideos = vi.fn();
const mockGetVideosOperation = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      config: { apiKey: string };
      models = {
        generateContent: mockGenerateContent,
        generateVideos: mockGenerateVideos,
      };
      operations = {
        getVideosOperation: mockGetVideosOperation,
      };
      constructor(config: { apiKey: string }) {
        this.config = config;
      }
    },
    Modality: {
      AUDIO: 'AUDIO',
    },
  };
});

import { GoogleGenAI } from '@google/genai';
import { getClient } from '../client';
import { generateAdventureText } from '../textGeneration';
import { generateSceneImage } from '../imageGeneration';
import { generateSceneVideo } from '../videoGeneration';
import { generateSpeech } from '../speechGeneration';

describe('getClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns GoogleGenAI instance with API_KEY', () => {
    process.env.API_KEY = 'test-api-key';
    const client = getClient();
    expect(client).toBeInstanceOf(GoogleGenAI);
    expect((client as unknown as { config: { apiKey: string } }).config.apiKey).toBe('test-api-key');
  });

  it('logs error when API_KEY missing', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.API_KEY;
    getClient();
    expect(consoleSpy).toHaveBeenCalledWith('API_KEY is missing from environment variables.');
    consoleSpy.mockRestore();
  });
});

describe('generateAdventureText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
  });

  it('formats history and calls API correctly', async () => {
    const mockText = 'Generated adventure text';
    mockGenerateContent.mockResolvedValue({ text: mockText });

    const history: ChatMessage[] = [
      { role: 'user', text: 'Hello' },
      { role: 'model', text: 'Welcome!' },
    ];

    const result = await generateAdventureText(history, 'Go north');

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: 'Hello' }] },
          { role: 'model', parts: [{ text: 'Welcome!' }] },
          { role: 'user', parts: [{ text: 'Go north' }] },
        ],
        config: expect.objectContaining({
          temperature: 0.9,
        }),
      })
    );
    expect(result).toBe(mockText);
  });

  it('throws on missing text response', async () => {
    mockGenerateContent.mockResolvedValue({ text: null });

    await expect(generateAdventureText([], 'test')).rejects.toThrow('No text generated');
  });
});

describe('generateSceneImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
  });

  it('calls correct model for fast quality', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [] } }],
    });

    await generateSceneImage('test prompt', 'fast');

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash-image',
      })
    );
  });

  it('calls correct model for quality mode with imageConfig', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [] } }],
    });

    await generateSceneImage('test prompt', 'quality');

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3-pro-image-preview',
        config: { imageConfig: { imageSize: '1K' } },
      })
    );
  });

  it('returns base64 data URL from inlineData', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{
            inlineData: {
              mimeType: 'image/png',
              data: 'base64imagedata',
            },
          }],
        },
      }],
    });

    const result = await generateSceneImage('test prompt');
    expect(result).toBe('data:image/png;base64,base64imagedata');
  });

  it('returns null on no image data', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [] } }],
    });

    const result = await generateSceneImage('test prompt');
    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateContent.mockRejectedValue(new Error('API error'));

    const result = await generateSceneImage('test prompt');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('generateSceneVideo', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
    global.fetch = mockFetch;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('polls operation until done', async () => {
    const mockBlob = new Blob(['video'], { type: 'video/mp4' });
    const mockBlobUrl = 'blob:http://localhost/video';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockBlobUrl);

    mockGenerateVideos.mockResolvedValue({ done: false });
    mockGetVideosOperation
      .mockResolvedValueOnce({ done: false })
      .mockResolvedValueOnce({
        done: true,
        response: {
          generatedVideos: [{ video: { uri: 'https://video.url' } }],
        },
      });
    mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const resultPromise = generateSceneVideo('test prompt', 'data:image/png;base64,abc123');
    
    await vi.advanceTimersByTimeAsync(10000);
    const result = await resultPromise;

    expect(mockGetVideosOperation).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockBlobUrl);
  });

  it('fetches and returns blob URL', async () => {
    const mockBlob = new Blob(['video'], { type: 'video/mp4' });
    const mockBlobUrl = 'blob:http://localhost/video';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockBlobUrl);

    mockGenerateVideos.mockResolvedValue({
      done: true,
      response: {
        generatedVideos: [{ video: { uri: 'https://video.url' } }],
      },
    });
    mockFetch.mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });

    const result = await generateSceneVideo('test prompt', 'data:image/png;base64,abc123');

    expect(mockFetch).toHaveBeenCalledWith('https://video.url&key=test-api-key');
    expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(result).toBe(mockBlobUrl);
  });

  it('returns null on error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateVideos.mockRejectedValue(new Error('Video generation failed'));

    const result = await generateSceneVideo('test prompt', 'data:image/png;base64,abc123');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('generateSpeech', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
  });

  it('returns audio data from response', async () => {
    const audioData = 'base64audiodata';
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{
            inlineData: { data: audioData },
          }],
        },
      }],
    });

    const result = await generateSpeech('Hello world');

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text: 'Hello world' }] },
        config: expect.objectContaining({
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        }),
      })
    );
    expect(result).toBe(audioData);
  });

  it('returns null on no audio data', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{}] } }],
    });

    const result = await generateSpeech('Hello world');
    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateContent.mockRejectedValue(new Error('TTS error'));

    const result = await generateSpeech('Hello world');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

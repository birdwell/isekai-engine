import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decodeBase64, decodeAudioData } from '../audio';

describe('decodeBase64', () => {
  it('decodes base64 string to Uint8Array', () => {
    const base64 = btoa('hello');
    const result = decodeBase64(base64);
    
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(5);
    expect(String.fromCharCode(...result)).toBe('hello');
  });

  it('handles empty string', () => {
    const base64 = btoa('');
    const result = decodeBase64(base64);
    
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  it('correctly decodes binary data', () => {
    const bytes = new Uint8Array([0, 127, 255]);
    const base64 = btoa(String.fromCharCode(...bytes));
    const result = decodeBase64(base64);
    
    expect(Array.from(result)).toEqual([0, 127, 255]);
  });
});

describe('decodeAudioData', () => {
  let mockAudioContext: {
    createBuffer: ReturnType<typeof vi.fn>;
  };
  let mockBuffer: {
    getChannelData: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockBuffer = {
      getChannelData: vi.fn().mockReturnValue(new Float32Array(100))
    };
    mockAudioContext = {
      createBuffer: vi.fn().mockReturnValue(mockBuffer)
    };
  });

  it('creates audio buffer with correct parameters', async () => {
    const data = new Uint8Array(200);
    
    await decodeAudioData(
      data,
      mockAudioContext as unknown as AudioContext,
      24000,
      1
    );
    
    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 100, 24000);
  });

  it('uses default sample rate of 24000', async () => {
    const data = new Uint8Array(200);
    
    await decodeAudioData(data, mockAudioContext as unknown as AudioContext);
    
    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 100, 24000);
  });

  it('uses default 1 channel', async () => {
    const data = new Uint8Array(200);
    
    await decodeAudioData(data, mockAudioContext as unknown as AudioContext);
    
    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 100, 24000);
  });

  it('handles stereo audio with 2 channels', async () => {
    const data = new Uint8Array(400);
    
    await decodeAudioData(
      data,
      mockAudioContext as unknown as AudioContext,
      44100,
      2
    );
    
    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(2, 100, 44100);
    expect(mockBuffer.getChannelData).toHaveBeenCalledWith(0);
    expect(mockBuffer.getChannelData).toHaveBeenCalledWith(1);
  });

  it('normalizes Int16 to Float32 range [-1, 1]', async () => {
    const channelData = new Float32Array(2);
    mockBuffer.getChannelData.mockReturnValue(channelData);
    
    const int16Data = new Int16Array([32767, -32768]);
    const data = new Uint8Array(int16Data.buffer);
    
    await decodeAudioData(
      data,
      mockAudioContext as unknown as AudioContext,
      24000,
      1
    );
    
    expect(channelData[0]).toBeCloseTo(1.0, 4);
    expect(channelData[1]).toBeCloseTo(-1.0, 4);
  });

  it('returns the created buffer', async () => {
    const data = new Uint8Array(200);
    
    const result = await decodeAudioData(
      data,
      mockAudioContext as unknown as AudioContext
    );
    
    expect(result).toBe(mockBuffer);
  });
});

import { useRef, useState, useEffect, useCallback } from 'react';
import { generateSpeech } from '@/services/gemini';
import { decodeBase64, decodeAudioData } from '@/utils/audio';

export const useAudioPlayer = (narrative: string | undefined) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    stopAudio();
  }, [narrative, stopAudio]);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const toggleAudio = useCallback(async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!narrative) return;

    setIsLoading(true);

    try {
      const cleanText = narrative.replace(/\*\*|__|\*|_/g, '');
      const audioData = await generateSpeech(cleanText);
      
      if (!audioData) {
        throw new Error("No audio data received");
      }

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;

      const pcmData = decodeBase64(audioData);
      const audioBuffer = await decodeAudioData(pcmData, audioCtx, 24000, 1);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
      };

      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
      
    } catch (err) {
      console.error("Failed to play audio:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, narrative, stopAudio]);

  return { isPlaying, isLoading, toggleAudio };
};

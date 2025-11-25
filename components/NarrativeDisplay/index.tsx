import React, { useEffect, useRef } from 'react';
import { GameResponse } from '@/types';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { NarrativeHeader } from './NarrativeHeader';
import { StoryText } from './StoryText';
import { LoadingIndicator } from './LoadingIndicator';

interface NarrativeDisplayProps {
  response: GameResponse | null;
  isLoading: boolean;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({ response, isLoading }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const { isPlaying, isLoading: isAudioLoading, toggleAudio } = useAudioPlayer(response?.narrative);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [response, isLoading]);

  if (!response && isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-amber-500 animate-pulse font-serif text-xl">Summoning world data...</div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center text-slate-500 italic">
        The void awaits your presence...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">
      <div className="max-w-3xl mx-auto space-y-6">
        <NarrativeHeader 
          isPlaying={isPlaying} 
          isLoading={isAudioLoading} 
          onAudioToggle={toggleAudio} 
        />
        <StoryText narrative={response.narrative} />
        {isLoading && <LoadingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  );
};

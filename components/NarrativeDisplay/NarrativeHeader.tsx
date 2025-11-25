import React from 'react';
import { AudioControls } from './AudioControls';

interface NarrativeHeaderProps {
  isPlaying: boolean;
  isLoading: boolean;
  onAudioToggle: () => void;
}

export const NarrativeHeader: React.FC<NarrativeHeaderProps> = ({ isPlaying, isLoading, onAudioToggle }) => {
  return (
    <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
      <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Adventure Log</span>
      <AudioControls isPlaying={isPlaying} isLoading={isLoading} onToggle={onAudioToggle} />
    </div>
  );
};

import React from 'react';
import { Volume2, Loader, Square } from 'lucide-react';

interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  onToggle: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({ isPlaying, isLoading, onToggle }) => {
  return (
    <button 
      onClick={onToggle}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all
        ${isPlaying 
          ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800' 
          : 'bg-amber-900/20 text-amber-500 hover:bg-amber-900/40 border border-amber-800/50'
        }
        ${isLoading ? 'opacity-75 cursor-wait' : ''}
      `}
    >
      {isLoading ? (
        <Loader className="w-3 h-3 animate-spin" />
      ) : isPlaying ? (
        <Square className="w-3 h-3 fill-current" />
      ) : (
        <Volume2 className="w-3 h-3" />
      )}
      <span>{isLoading ? 'INITIALIZING...' : isPlaying ? 'STOP NARRATION' : 'READ ALOUD'}</span>
    </button>
  );
};

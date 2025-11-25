import React from 'react';
import { Paintbrush } from 'lucide-react';

interface NewSceneBadgeProps {
  onClick: () => void;
}

export const NewSceneBadge: React.FC<NewSceneBadgeProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 bg-amber-600/90 hover:bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-amber-900/50 backdrop-blur animate-pulse"
    >
      <Paintbrush className="w-3 h-3" />
      New Scene Available
    </button>
  );
};

import React from 'react';
import { ImageIcon, Paintbrush } from 'lucide-react';

interface EmptyStateProps {
  onPaintScene: () => void;
  canPaint: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onPaintScene, canPaint }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
      <ImageIcon className="w-12 h-12 mb-4 opacity-30" />
      <span className="text-sm uppercase tracking-widest mb-4">No Visual Data</span>
      <button 
        onClick={onPaintScene}
        disabled={!canPaint}
        className={`px-4 py-2 rounded border transition-all flex items-center gap-2 ${
          canPaint 
            ? 'bg-slate-800 hover:bg-amber-700 text-slate-300 hover:text-white border-slate-700 hover:border-amber-500' 
            : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
        }`}
      >
        <Paintbrush className="w-4 h-4" />
        <span>{canPaint ? 'Paint This Scene' : 'Awaiting Scene Data...'}</span>
      </button>
    </div>
  );
};

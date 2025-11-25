import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryNavigationProps {
  gallerySize: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export const GalleryNavigation: React.FC<GalleryNavigationProps> = ({
  gallerySize,
  currentIndex,
  onNext,
  onPrev
}) => {
  if (gallerySize <= 1) return null;

  return (
    <div className="flex items-center bg-slate-900/80 backdrop-blur rounded-full border border-slate-700 p-1 gap-2 shadow-lg">
      <button 
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="p-1.5 hover:bg-slate-700 rounded-full text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs font-mono font-bold text-amber-500 px-1">
        {currentIndex + 1} / {gallerySize}
      </span>
      <button 
        onClick={onNext}
        disabled={currentIndex === gallerySize - 1}
        className="p-1.5 hover:bg-slate-700 rounded-full text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

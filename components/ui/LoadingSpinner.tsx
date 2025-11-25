import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
      <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-2"></div>
      <span className="text-xs text-amber-500 font-mono tracking-widest uppercase animate-pulse">
        {message}
      </span>
    </div>
  );
};

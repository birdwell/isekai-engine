import React from 'react';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 text-slate-500 mt-4 animate-pulse">
      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
      <span className="w-2 h-2 bg-amber-500 rounded-full delay-75"></span>
      <span className="w-2 h-2 bg-amber-500 rounded-full delay-150"></span>
    </div>
  );
};

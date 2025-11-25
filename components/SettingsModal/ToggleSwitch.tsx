import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled }) => {
  return (
    <div className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? 'bg-amber-600' : 'bg-slate-700'}`}>
      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'left-6' : 'left-1'}`}></div>
    </div>
  );
};

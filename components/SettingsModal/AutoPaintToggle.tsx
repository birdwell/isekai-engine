import React from 'react';
import { Paintbrush } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';

interface AutoPaintToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export const AutoPaintToggle: React.FC<AutoPaintToggleProps> = ({ enabled, onToggle }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-300 uppercase tracking-widest block">Automation</label>
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${enabled ? 'bg-amber-900/20 border-amber-500' : 'bg-slate-800 border-slate-700'}`}
      >
        <div className="flex items-center gap-3">
          <Paintbrush className={`w-5 h-5 ${enabled ? 'text-amber-500' : 'text-slate-500'}`} />
          <div className="text-left">
            <div className={`font-bold text-sm ${enabled ? 'text-amber-100' : 'text-slate-400'}`}>Auto-Paint Scenes</div>
            <div className="text-xs text-slate-500">
              {enabled ? 'Images generate automatically every turn.' : 'Manual generation only.'}
            </div>
          </div>
        </div>
        <ToggleSwitch enabled={enabled} />
      </button>
    </div>
  );
};

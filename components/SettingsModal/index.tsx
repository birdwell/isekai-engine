import React from 'react';
import { X } from 'lucide-react';
import { AutoPaintToggle } from './AutoPaintToggle';
import { QualitySettings } from './QualitySettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quality: 'fast' | 'quality';
  setQuality: (q: 'fast' | 'quality') => void;
  autoPaint: boolean;
  setAutoPaint: (b: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  quality, 
  setQuality,
  autoPaint,
  setAutoPaint
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <h3 className="font-serif font-bold text-amber-500 tracking-wide">System Configuration</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <AutoPaintToggle enabled={autoPaint} onToggle={() => setAutoPaint(!autoPaint)} />
          <hr className="border-slate-800"/>
          <QualitySettings quality={quality} onSelect={setQuality} />
          
          <div className="text-xs text-slate-500 italic text-center">
            * Video generation always uses the Veo High-Fidelity model.
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-bold text-sm transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

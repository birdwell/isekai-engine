
import React from 'react';
import { X, Zap, Star, Paintbrush } from 'lucide-react';

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
            
            {/* Auto-Paint Toggle */}
            <div className="space-y-3">
                 <label className="text-sm font-bold text-slate-300 uppercase tracking-widest block">Automation</label>
                 <button 
                    onClick={() => setAutoPaint(!autoPaint)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${autoPaint ? 'bg-amber-900/20 border-amber-500' : 'bg-slate-800 border-slate-700'}`}
                 >
                     <div className="flex items-center gap-3">
                         <Paintbrush className={`w-5 h-5 ${autoPaint ? 'text-amber-500' : 'text-slate-500'}`} />
                         <div className="text-left">
                             <div className={`font-bold text-sm ${autoPaint ? 'text-amber-100' : 'text-slate-400'}`}>Auto-Paint Scenes</div>
                             <div className="text-xs text-slate-500">
                                 {autoPaint ? 'Images generate automatically every turn.' : 'Manual generation only.'}
                             </div>
                         </div>
                     </div>
                     <div className={`w-10 h-5 rounded-full relative transition-colors ${autoPaint ? 'bg-amber-600' : 'bg-slate-700'}`}>
                         <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${autoPaint ? 'left-6' : 'left-1'}`}></div>
                     </div>
                 </button>
            </div>

            <hr className="border-slate-800"/>

            {/* Quality Settings */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest block">Image Generation Engine</label>
                <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={() => setQuality('fast')}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${quality === 'fast' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                        <div className={`p-2 rounded-md ${quality === 'fast' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-sm">Flash Speed (Default)</div>
                            <div className="text-xs opacity-70">Generates images instantly. Standard quality.</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => setQuality('quality')}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${quality === 'quality' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                        <div className={`p-2 rounded-md ${quality === 'quality' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                            <Star className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-sm">Pro Quality</div>
                            <div className="text-xs opacity-70">High resolution (1K). Slower generation time. Requires paid key.</div>
                        </div>
                    </button>
                </div>
            </div>
            
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

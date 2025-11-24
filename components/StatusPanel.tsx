
import React, { useState } from 'react';
import { GameStatus } from '../types';
import { Shield, MapPin, ShoppingBag, ScrollText, Coins, X } from 'lucide-react';

interface StatusPanelProps {
  status: GameStatus | null;
  onUseItem: (item: string) => void;
  questLog: string[];
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ status, onUseItem, questLog }) => {
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);

  if (!status) return null;

  return (
    <div className="bg-slate-900/80 p-5 w-full flex flex-col backdrop-blur-sm relative">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-5">
        <h2 className="text-xl font-bold text-amber-500 font-serif tracking-wide">STATUS</h2>
        <span className="text-xs text-slate-500 uppercase tracking-widest">Character Sheet</span>
      </div>
      
      <div className="space-y-6">
        
        {/* HP & Location Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* HP */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
               <Shield className="w-3 h-3 text-red-500" />
               <span>Vitality</span>
             </div>
             <div className="text-lg font-bold text-white">{status.hp}</div>
          </div>
          
          {/* Location */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
               <MapPin className="w-3 h-3 text-emerald-500" />
               <span>Location</span>
             </div>
             <div className="text-sm font-medium text-emerald-100 leading-tight">{status.location}</div>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
           <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-800 flex items-center gap-2">
              <Coins className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Currency</span>
           </div>
           <div className="grid grid-cols-3 divide-x divide-slate-800">
              <div className="p-3 text-center hover:bg-slate-800/30 transition-colors">
                  <div className="text-lg font-bold text-yellow-500 shadow-amber-500/10 drop-shadow-sm">{status.currency.gold}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gold</div>
              </div>
              <div className="p-3 text-center hover:bg-slate-800/30 transition-colors">
                  <div className="text-lg font-bold text-slate-300">{status.currency.silver}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Silver</div>
              </div>
              <div className="p-3 text-center hover:bg-slate-800/30 transition-colors">
                  <div className="text-lg font-bold text-orange-500">{status.currency.copper}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Copper</div>
              </div>
           </div>
        </div>

        {/* Quest */}
        <div className="space-y-2">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <ScrollText className="w-3 h-3 text-blue-400" />
                <span>Current Objective</span>
             </div>
             <button 
                 onClick={() => setIsQuestLogOpen(true)}
                 className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 transition-colors font-bold"
             >
                 VIEW LOG
             </button>
          </div>
          <div className="bg-blue-900/10 border border-blue-900/30 p-3 rounded-lg text-blue-200 text-sm leading-relaxed">
            "{status.activeQuest}"
          </div>
        </div>

        {/* Inventory */}
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <ShoppingBag className="w-3 h-3 text-amber-400" />
            <span>Inventory</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {status.inventory.length > 0 ? (
                status.inventory.map((item, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => onUseItem(item)}
                        className="flex flex-col items-start p-2.5 rounded-lg border border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-amber-500/50 transition-all group text-left"
                    >
                        <span className="text-sm text-slate-300 group-hover:text-amber-100 font-medium truncate w-full">{item}</span>
                        <span className="text-[10px] text-slate-600 group-hover:text-amber-500 uppercase tracking-wider mt-1 opacity-60 group-hover:opacity-100">Click to Use</span>
                    </button>
                ))
            ) : (
                <div className="col-span-2 bg-slate-800/20 border border-slate-800 border-dashed rounded-lg p-4 text-center text-slate-600 text-sm italic">
                  Bag is empty
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Quest Log Modal */}
      {isQuestLogOpen && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-5 animate-fade-in min-h-full">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-xl font-serif font-bold text-blue-400">Quest Journal</h3>
                <button onClick={() => setIsQuestLogOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {questLog.length === 0 ? (
                    <p className="text-slate-500 italic text-center mt-10">No quests recorded yet.</p>
                ) : (
                    questLog.map((quest, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border ${idx === questLog.length - 1 ? 'bg-blue-900/10 border-blue-500/30 shadow-lg shadow-blue-900/20' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                            <div className="text-[10px] font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                                {idx === questLog.length - 1 ? (
                                    <span className="text-blue-400">● Current Objective</span>
                                ) : (
                                    <span className="text-slate-500">● Completed / Past</span>
                                )}
                            </div>
                            <p className="text-slate-200 text-sm leading-relaxed">{quest}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}
    </div>
  );
};

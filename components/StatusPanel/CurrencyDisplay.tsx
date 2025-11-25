import React from 'react';
import { Coins } from 'lucide-react';

interface CurrencyDisplayProps {
  gold: number;
  silver: number;
  copper: number;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ gold, silver, copper }) => {
  return (
    <div className="bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
      <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-800 flex items-center gap-2">
        <Coins className="w-3 h-3 text-yellow-400" />
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Currency</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-800">
        <div className="p-3 text-center hover:bg-slate-800/30 transition-colors">
          <div className="text-lg font-bold text-yellow-500 shadow-amber-500/10 drop-shadow-sm">{gold}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gold</div>
        </div>
        <div className="p-3 text-center hover:bg-slate-800/30 transition-colors">
          <div className="text-lg font-bold text-slate-300">{silver}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Silver</div>
        </div>
        <div className="p-3 text-center hover:bg-slate-800/30 transition-colors">
          <div className="text-lg font-bold text-orange-500">{copper}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Copper</div>
        </div>
      </div>
    </div>
  );
};

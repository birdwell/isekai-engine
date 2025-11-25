import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface InventoryGridProps {
  items: string[];
  onUseItem: (item: string) => void;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({ items, onUseItem }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <ShoppingBag className="w-3 h-3 text-amber-400" />
        <span>Inventory</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.length > 0 ? (
          items.map((item, idx) => (
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
  );
};

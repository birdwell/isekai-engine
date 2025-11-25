import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QualityOptionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export const QualityOption: React.FC<QualityOptionProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  selected, 
  onClick 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${selected ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
    >
      <div className={`p-2 rounded-md ${selected ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs opacity-70">{description}</div>
      </div>
    </button>
  );
};

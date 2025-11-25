import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string | number;
  valueColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  iconColor, 
  label, 
  value,
  valueColor = 'text-white'
}) => {
  return (
    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
        <Icon className={`w-3 h-3 ${iconColor}`} />
        <span>{label}</span>
      </div>
      <div className={`text-lg font-bold ${valueColor}`}>{value}</div>
    </div>
  );
};

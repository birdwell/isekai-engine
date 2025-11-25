import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationCardProps {
  location: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  return (
    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
        <MapPin className="w-3 h-3 text-emerald-500" />
        <span>Location</span>
      </div>
      <div className="text-sm font-medium text-emerald-100 leading-tight">{location}</div>
    </div>
  );
};

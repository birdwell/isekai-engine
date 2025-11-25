import React from 'react';
import { Zap, Star } from 'lucide-react';
import { QualityOption } from './QualityOption';

interface QualitySettingsProps {
  quality: 'fast' | 'quality';
  onSelect: (quality: 'fast' | 'quality') => void;
}

export const QualitySettings: React.FC<QualitySettingsProps> = ({ quality, onSelect }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-300 uppercase tracking-widest block">Image Generation Engine</label>
      <div className="grid grid-cols-1 gap-3">
        <QualityOption
          icon={Zap}
          title="Flash Speed (Default)"
          description="Generates images instantly. Standard quality."
          selected={quality === 'fast'}
          onClick={() => onSelect('fast')}
        />
        <QualityOption
          icon={Star}
          title="Pro Quality"
          description="High resolution (1K). Slower generation time. Requires paid key."
          selected={quality === 'quality'}
          onClick={() => onSelect('quality')}
        />
      </div>
    </div>
  );
};

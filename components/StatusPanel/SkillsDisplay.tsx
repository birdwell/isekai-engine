import React from 'react';
import { Sparkles } from 'lucide-react';

interface SkillsDisplayProps {
  skills: string[];
}

export const SkillsDisplay: React.FC<SkillsDisplayProps> = ({ skills }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Sparkles className="w-3 h-3 text-purple-400" />
        <span>Skills</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.map((skill, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-lg border border-purple-700/50 bg-purple-900/20 text-purple-300 text-sm font-medium"
            >
              {skill}
            </div>
          ))
        ) : (
          <div className="w-full bg-slate-800/20 border border-slate-800 border-dashed rounded-lg p-4 text-center text-slate-600 text-sm italic">
            No skills acquired
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { ScrollText, Target, CheckCircle2 } from 'lucide-react';
import { Quest, QuestStatus, QuestType } from '@/types';

interface QuestDisplayProps {
  activeQuest: Quest | null;
  activeQuestText: string;
  onViewLog: () => void;
  getProgress: (questId: string) => number;
}

export const QuestDisplay: React.FC<QuestDisplayProps> = ({ 
  activeQuest, 
  activeQuestText, 
  onViewLog,
  getProgress 
}) => {
  const progress = activeQuest ? getProgress(activeQuest.id) : 0;
  const displayTitle = activeQuest?.title || activeQuestText || "No active quest";
  
  const typeLabel = activeQuest?.type === QuestType.Main ? 'MAIN QUEST' : 
                    activeQuest?.type === QuestType.Side ? 'SIDE QUEST' : 'OBJECTIVE';
  
  const typeColor = activeQuest?.type === QuestType.Main ? 'text-amber-400' : 
                    activeQuest?.type === QuestType.Side ? 'text-purple-400' : 'text-blue-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <ScrollText className="w-3 h-3 text-blue-400" />
          <span>Current Objective</span>
        </div>
        <button 
          onClick={onViewLog}
          className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 transition-colors font-bold"
        >
          VIEW LOG
        </button>
      </div>
      
      <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/50 border border-blue-900/30 p-4 rounded-lg">
        <div className="flex items-start justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColor}`}>
            {typeLabel}
          </span>
          {activeQuest && (
            <span className="text-[10px] text-slate-500">
              {progress}% complete
            </span>
          )}
        </div>
        
        <p className="text-blue-100 text-sm font-medium leading-relaxed mb-3">
          {displayTitle}
        </p>

        {activeQuest && activeQuest.objectives.length > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t border-slate-700/50">
            {activeQuest.objectives.slice(0, 3).map((objective) => (
              <div 
                key={objective.id} 
                className={`flex items-start gap-2 text-xs ${
                  objective.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'
                }`}
              >
                {objective.isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <Target className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                )}
                <span className="leading-tight">
                  {objective.description}
                  {objective.isOptional && (
                    <span className="text-slate-500 ml-1">(optional)</span>
                  )}
                </span>
              </div>
            ))}
            {activeQuest.objectives.length > 3 && (
              <button 
                onClick={onViewLog}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                +{activeQuest.objectives.length - 3} more objectives...
              </button>
            )}
          </div>
        )}

        {activeQuest && progress > 0 && (
          <div className="mt-3">
            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, CheckCircle2, Target, Clock, Trophy, Skull, Star, ChevronDown, ChevronRight } from 'lucide-react';
import { Quest, QuestStatus, QuestType } from '@/types';

interface QuestLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  activeQuestId: string | null;
  onSetActiveQuest: (questId: string) => void;
  getProgress: (questId: string) => number;
}

type FilterType = 'all' | 'active' | 'completed' | 'failed';

export const QuestLogModal: React.FC<QuestLogModalProps> = ({ 
  isOpen, 
  onClose, 
  quests,
  activeQuestId,
  onSetActiveQuest,
  getProgress
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredQuests = quests.filter(quest => {
    if (filter === 'all') return true;
    if (filter === 'active') return quest.status === QuestStatus.Active;
    if (filter === 'completed') return quest.status === QuestStatus.Completed;
    if (filter === 'failed') return quest.status === QuestStatus.Failed;
    return true;
  });

  const mainQuests = filteredQuests.filter(q => q.type === QuestType.Main);
  const sideQuests = filteredQuests.filter(q => q.type === QuestType.Side);

  const getStatusIcon = (status: QuestStatus) => {
    switch (status) {
      case QuestStatus.Completed: return <Trophy className="w-4 h-4 text-emerald-400" />;
      case QuestStatus.Failed: return <Skull className="w-4 h-4 text-red-400" />;
      case QuestStatus.Active: return <Target className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: QuestStatus) => {
    switch (status) {
      case QuestStatus.Completed: return 'border-emerald-500/30 bg-emerald-900/10';
      case QuestStatus.Failed: return 'border-red-500/30 bg-red-900/10';
      case QuestStatus.Active: return 'border-blue-500/30 bg-blue-900/10';
      default: return 'border-slate-700 bg-slate-900';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderQuestCard = (quest: Quest) => {
    const isExpanded = expandedQuest === quest.id;
    const isActive = quest.id === activeQuestId;
    const progress = getProgress(quest.id);

    return (
      <div 
        key={quest.id} 
        className={`rounded-lg border transition-all ${getStatusColor(quest.status)} ${
          isActive ? 'ring-2 ring-amber-500/50' : ''
        }`}
      >
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
              )}
              {getStatusIcon(quest.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-100 truncate">{quest.title}</h4>
                  {isActive && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{quest.description}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                quest.type === QuestType.Main ? 'text-amber-400' : 'text-purple-400'
              }`}>
                {quest.type === QuestType.Main ? 'Main' : 'Side'}
              </span>
              {quest.status === QuestStatus.Active && (
                <div className="text-[10px] text-slate-500 mt-1">{progress}%</div>
              )}
            </div>
          </div>

          {quest.status === QuestStatus.Active && (
            <div className="mt-3">
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 space-y-3">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Objectives
              </span>
              {quest.objectives.map((objective) => (
                <div 
                  key={objective.id} 
                  className={`flex items-start gap-2 text-sm ${
                    objective.isCompleted ? 'text-slate-500' : 'text-slate-300'
                  }`}
                >
                  {objective.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <Target className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  )}
                  <span className={objective.isCompleted ? 'line-through' : ''}>
                    {objective.description}
                    {objective.isOptional && (
                      <span className="text-slate-500 ml-1 text-xs">(optional)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {quest.rewards && quest.rewards.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Rewards
                </span>
                <div className="flex flex-wrap gap-2">
                  {quest.rewards.map((reward, idx) => (
                    <span 
                      key={idx}
                      className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20"
                    >
                      <Star className="w-3 h-3 inline mr-1" />
                      {reward}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
              <span className="text-[10px] text-slate-500">
                Started: {formatTime(quest.startedAt)}
                {quest.completedAt && ` • Ended: ${formatTime(quest.completedAt)}`}
              </span>
              
              {quest.status === QuestStatus.Active && !isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetActiveQuest(quest.id);
                  }}
                  className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-2 py-1 rounded border border-amber-500/30 transition-colors font-bold"
                >
                  SET ACTIVE
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuestSection = (title: string, questList: Quest[], color: string) => {
    if (questList.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${color} flex items-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-current" />
          {title}
        </h3>
        <div className="space-y-2">
          {questList.map(renderQuestCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col animate-fade-in min-h-full">
      <div className="flex items-center justify-between p-5 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-serif font-bold text-blue-400">Quest Journal</h3>
          <p className="text-xs text-slate-500 mt-1">
            {quests.filter(q => q.status === QuestStatus.Active).length} active • 
            {quests.filter(q => q.status === QuestStatus.Completed).length} completed
          </p>
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-2 px-5 py-3 border-b border-slate-800">
        {(['all', 'active', 'completed', 'failed'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-colors ${
              filter === f 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {filteredQuests.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 italic">No quests match the current filter.</p>
          </div>
        ) : (
          <>
            {renderQuestSection('Main Quests', mainQuests, 'text-amber-400')}
            {renderQuestSection('Side Quests', sideQuests, 'text-purple-400')}
          </>
        )}
      </div>
    </div>
  );
};

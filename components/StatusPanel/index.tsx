import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { GameStatus, QuestSystem } from '@/types';
import { StatCard } from './StatCard';
import { LocationCard } from './LocationCard';
import { CurrencyDisplay } from './CurrencyDisplay';
import { QuestDisplay } from './QuestDisplay';
import { InventoryGrid } from './InventoryGrid';
import { SkillsDisplay } from './SkillsDisplay';
import { QuestLogModal } from './QuestLogModal';

interface StatusPanelProps {
  status: GameStatus | null;
  onUseItem: (item: string) => void;
  questSystem: QuestSystem;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ 
  status, 
  onUseItem, 
  questSystem,
}) => {
  const { activeQuest, questState, setActiveQuest, getQuestProgress } = questSystem;
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);

  if (!status) return null;

  return (
    <div className="bg-slate-900/80 p-5 w-full flex flex-col backdrop-blur-sm relative">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-5">
        <h2 className="text-xl font-bold text-amber-500 font-serif tracking-wide">STATUS</h2>
        <span className="text-xs text-slate-500 uppercase tracking-widest">Character Sheet</span>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            icon={Shield} 
            iconColor="text-red-500" 
            label="Vitality" 
            value={status.hp} 
          />
          <LocationCard location={status.location} />
        </div>

        <CurrencyDisplay 
          gold={status.currency.gold} 
          silver={status.currency.silver} 
          copper={status.currency.copper} 
        />

        <QuestDisplay 
          activeQuest={activeQuest}
          activeQuestText={status.activeQuest}
          onViewLog={() => setIsQuestLogOpen(true)}
          getProgress={getQuestProgress}
        />

        <SkillsDisplay skills={status.skills || []} />

        <InventoryGrid items={status.inventory} onUseItem={onUseItem} />
      </div>

      <QuestLogModal 
        isOpen={isQuestLogOpen} 
        onClose={() => setIsQuestLogOpen(false)} 
        quests={questState.quests}
        activeQuestId={questState.activeQuestId}
        onSetActiveQuest={setActiveQuest}
        getProgress={getQuestProgress}
      />
    </div>
  );
};

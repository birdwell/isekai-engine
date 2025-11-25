import { useState, useCallback, useMemo } from 'react';
import { Quest, QuestState, QuestStatus, QuestType, QuestObjective } from '../types';

const generateQuestId = () => `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateObjectiveId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useQuestSystem = (initialState?: QuestState) => {
  const [questState, setQuestState] = useState<QuestState>(
    initialState || { quests: [], activeQuestId: null }
  );

  const activeQuest = useMemo(() => {
    if (!questState.activeQuestId) return null;
    return questState.quests.find(q => q.id === questState.activeQuestId) || null;
  }, [questState.quests, questState.activeQuestId]);

  const activeQuests = useMemo(() => 
    questState.quests.filter(q => q.status === QuestStatus.Active),
    [questState.quests]
  );

  const completedQuests = useMemo(() => 
    questState.quests.filter(q => q.status === QuestStatus.Completed),
    [questState.quests]
  );

  const mainQuests = useMemo(() => 
    questState.quests.filter(q => q.type === QuestType.Main),
    [questState.quests]
  );

  const sideQuests = useMemo(() => 
    questState.quests.filter(q => q.type === QuestType.Side),
    [questState.quests]
  );

  const addQuest = useCallback((
    title: string,
    description: string,
    type: QuestType = QuestType.Main,
    objectives: string[] = [],
    rewards?: string[]
  ): Quest => {
    const newQuest: Quest = {
      id: generateQuestId(),
      title,
      description,
      type,
      status: QuestStatus.Active,
      objectives: objectives.map(desc => ({
        id: generateObjectiveId(),
        description: desc,
        isCompleted: false
      })),
      rewards,
      startedAt: Date.now()
    };

    setQuestState(prev => ({
      ...prev,
      quests: [...prev.quests, newQuest],
      activeQuestId: prev.activeQuestId || newQuest.id
    }));

    return newQuest;
  }, []);

  const updateQuestFromNarrative = useCallback((activeQuestText: string) => {
    if (!activeQuestText || activeQuestText === "Unknown" || activeQuestText === "None") {
      return;
    }

    setQuestState(prev => {
      const existingQuest = prev.quests.find(
        q => q.status === QuestStatus.Active && 
        (q.title.toLowerCase() === activeQuestText.toLowerCase() ||
         q.description.toLowerCase().includes(activeQuestText.toLowerCase()))
      );

      if (existingQuest) {
        return {
          ...prev,
          activeQuestId: existingQuest.id
        };
      }

      const newQuest: Quest = {
        id: generateQuestId(),
        title: activeQuestText,
        description: activeQuestText,
        type: QuestType.Main,
        status: QuestStatus.Active,
        objectives: [{
          id: generateObjectiveId(),
          description: activeQuestText,
          isCompleted: false
        }],
        startedAt: Date.now()
      };

      return {
        quests: [...prev.quests, newQuest],
        activeQuestId: newQuest.id
      };
    });
  }, []);

  const completeObjective = useCallback((questId: string, objectiveId: string) => {
    setQuestState(prev => ({
      ...prev,
      quests: prev.quests.map(quest => {
        if (quest.id !== questId) return quest;

        const updatedObjectives = quest.objectives.map(obj =>
          obj.id === objectiveId ? { ...obj, isCompleted: true } : obj
        );

        const requiredObjectives = updatedObjectives.filter(o => !o.isOptional);
        const allRequiredComplete = requiredObjectives.every(o => o.isCompleted);

        return {
          ...quest,
          objectives: updatedObjectives,
          status: allRequiredComplete ? QuestStatus.Completed : quest.status,
          completedAt: allRequiredComplete ? Date.now() : undefined
        };
      })
    }));
  }, []);

  const completeQuest = useCallback((questId: string) => {
    setQuestState(prev => {
      const updatedQuests = prev.quests.map(quest =>
        quest.id === questId
          ? {
              ...quest,
              status: QuestStatus.Completed,
              completedAt: Date.now(),
              objectives: quest.objectives.map(o => ({ ...o, isCompleted: true }))
            }
          : quest
      );

      const nextActiveQuest = updatedQuests.find(
        q => q.status === QuestStatus.Active && q.id !== questId
      );

      return {
        quests: updatedQuests,
        activeQuestId: nextActiveQuest?.id || null
      };
    });
  }, []);

  const failQuest = useCallback((questId: string) => {
    setQuestState(prev => ({
      ...prev,
      quests: prev.quests.map(quest =>
        quest.id === questId
          ? { ...quest, status: QuestStatus.Failed, completedAt: Date.now() }
          : quest
      ),
      activeQuestId: prev.activeQuestId === questId ? null : prev.activeQuestId
    }));
  }, []);

  const setActiveQuest = useCallback((questId: string | null) => {
    setQuestState(prev => ({
      ...prev,
      activeQuestId: questId
    }));
  }, []);

  const addObjective = useCallback((questId: string, description: string, isOptional = false) => {
    const newObjective: QuestObjective = {
      id: generateObjectiveId(),
      description,
      isCompleted: false,
      isOptional
    };

    setQuestState(prev => ({
      ...prev,
      quests: prev.quests.map(quest =>
        quest.id === questId
          ? { ...quest, objectives: [...quest.objectives, newObjective] }
          : quest
      )
    }));

    return newObjective;
  }, []);

  const getQuestProgress = useCallback((questId: string): number => {
    const quest = questState.quests.find(q => q.id === questId);
    if (!quest || quest.objectives.length === 0) return 0;

    const completed = quest.objectives.filter(o => o.isCompleted).length;
    return Math.round((completed / quest.objectives.length) * 100);
  }, [questState.quests]);

  const loadQuestState = useCallback((state: QuestState) => {
    setQuestState(state);
  }, []);

  return {
    questState,
    activeQuest,
    activeQuests,
    completedQuests,
    mainQuests,
    sideQuests,
    addQuest,
    updateQuestFromNarrative,
    completeObjective,
    completeQuest,
    failQuest,
    setActiveQuest,
    addObjective,
    getQuestProgress,
    loadQuestState
  };
};

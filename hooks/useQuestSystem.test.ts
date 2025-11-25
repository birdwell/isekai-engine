import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestSystem } from './useQuestSystem';
import { QuestStatus, QuestType, QuestState } from '../types';

describe('useQuestSystem', () => {
  describe('initialization', () => {
    it('starts with empty quest state', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      expect(result.current.questState.quests).toEqual([]);
      expect(result.current.questState.activeQuestId).toBeNull();
    });

    it('accepts initial state', () => {
      const initialState: QuestState = {
        quests: [{
          id: 'test-1',
          title: 'Test Quest',
          description: 'A test',
          type: QuestType.Main,
          status: QuestStatus.Active,
          objectives: [],
          startedAt: Date.now()
        }],
        activeQuestId: 'test-1'
      };
      
      const { result } = renderHook(() => useQuestSystem(initialState));
      
      expect(result.current.questState.quests).toHaveLength(1);
      expect(result.current.questState.activeQuestId).toBe('test-1');
    });
  });

  describe('addQuest', () => {
    it('adds a new quest', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Find the Artifact', 'Locate the ancient artifact');
      });
      
      expect(result.current.questState.quests).toHaveLength(1);
      expect(result.current.questState.quests[0].title).toBe('Find the Artifact');
    });

    it('sets quest type', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Side Quest', 'A side adventure', QuestType.Side);
      });
      
      expect(result.current.questState.quests[0].type).toBe(QuestType.Side);
    });

    it('creates objectives from array', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Multi-step', 'Quest with steps', QuestType.Main, [
          'Step 1',
          'Step 2',
          'Step 3'
        ]);
      });
      
      expect(result.current.questState.quests[0].objectives).toHaveLength(3);
      expect(result.current.questState.quests[0].objectives[0].description).toBe('Step 1');
    });

    it('sets rewards', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Rewarding', 'Get rewards', QuestType.Main, [], ['100 Gold', 'Magic Sword']);
      });
      
      expect(result.current.questState.quests[0].rewards).toEqual(['100 Gold', 'Magic Sword']);
    });

    it('auto-sets first quest as active', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('First Quest', 'The first one');
      });
      
      expect(result.current.questState.activeQuestId).toBe(result.current.questState.quests[0].id);
    });

    it('does not override active quest when adding subsequent quests', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('First', 'First quest');
      });
      
      const firstQuestId = result.current.questState.activeQuestId;
      
      act(() => {
        result.current.addQuest('Second', 'Second quest');
      });
      
      expect(result.current.questState.activeQuestId).toBe(firstQuestId);
    });

    it('returns the created quest', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      let createdQuest: ReturnType<typeof result.current.addQuest>;
      act(() => {
        createdQuest = result.current.addQuest('New Quest', 'Description');
      });
      
      expect(createdQuest!.title).toBe('New Quest');
      expect(createdQuest!.status).toBe(QuestStatus.Active);
    });
  });

  describe('completeQuest', () => {
    it('marks quest as completed', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'To complete');
      });
      
      const questId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.completeQuest(questId);
      });
      
      expect(result.current.questState.quests[0].status).toBe(QuestStatus.Completed);
    });

    it('sets completedAt timestamp', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'To complete');
      });
      
      const questId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.completeQuest(questId);
      });
      
      expect(result.current.questState.quests[0].completedAt).toBeDefined();
    });

    it('marks all objectives as completed', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'Complete', QuestType.Main, ['Obj 1', 'Obj 2']);
      });
      
      const questId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.completeQuest(questId);
      });
      
      expect(result.current.questState.quests[0].objectives.every(o => o.isCompleted)).toBe(true);
    });

    it('sets next active quest when completing current active', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('First', 'First quest');
        result.current.addQuest('Second', 'Second quest');
      });
      
      const firstQuestId = result.current.questState.quests[0].id;
      const secondQuestId = result.current.questState.quests[1].id;
      
      act(() => {
        result.current.completeQuest(firstQuestId);
      });
      
      expect(result.current.questState.activeQuestId).toBe(secondQuestId);
    });
  });

  describe('failQuest', () => {
    it('marks quest as failed', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'To fail');
      });
      
      const questId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.failQuest(questId);
      });
      
      expect(result.current.questState.quests[0].status).toBe(QuestStatus.Failed);
    });

    it('clears active quest if failed quest was active', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Only Quest', 'Will fail');
      });
      
      const questId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.failQuest(questId);
      });
      
      expect(result.current.questState.activeQuestId).toBeNull();
    });
  });

  describe('completeObjective', () => {
    it('marks specific objective as completed', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'With objectives', QuestType.Main, ['Obj 1', 'Obj 2']);
      });
      
      const quest = result.current.questState.quests[0];
      
      act(() => {
        result.current.completeObjective(quest.id, quest.objectives[0].id);
      });
      
      expect(result.current.questState.quests[0].objectives[0].isCompleted).toBe(true);
      expect(result.current.questState.quests[0].objectives[1].isCompleted).toBe(false);
    });

    it('completes quest when all required objectives done', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'With objectives', QuestType.Main, ['Only objective']);
      });
      
      const quest = result.current.questState.quests[0];
      
      act(() => {
        result.current.completeObjective(quest.id, quest.objectives[0].id);
      });
      
      expect(result.current.questState.quests[0].status).toBe(QuestStatus.Completed);
    });
  });

  describe('addObjective', () => {
    it('adds objective to existing quest', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'Description');
      });
      
      const questId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.addObjective(questId, 'New objective');
      });
      
      expect(result.current.questState.quests[0].objectives).toHaveLength(1);
    });

    it('can add optional objectives', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'Description');
      });
      
      const questId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.addObjective(questId, 'Optional objective', true);
      });
      
      expect(result.current.questState.quests[0].objectives[0].isOptional).toBe(true);
    });
  });

  describe('setActiveQuest', () => {
    it('sets the active quest', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('First', 'First');
        result.current.addQuest('Second', 'Second');
      });
      
      const secondQuestId = result.current.questState.quests[1].id;
      
      act(() => {
        result.current.setActiveQuest(secondQuestId);
      });
      
      expect(result.current.questState.activeQuestId).toBe(secondQuestId);
    });

    it('can clear active quest', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'Description');
      });
      
      act(() => {
        result.current.setActiveQuest(null);
      });
      
      expect(result.current.questState.activeQuestId).toBeNull();
    });
  });

  describe('updateQuestFromNarrative', () => {
    it('creates new quest from narrative text', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.updateQuestFromNarrative('Find the Lost Sword');
      });
      
      expect(result.current.questState.quests).toHaveLength(1);
      expect(result.current.questState.quests[0].title).toBe('Find the Lost Sword');
    });

    it('ignores Unknown narrative', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.updateQuestFromNarrative('Unknown');
      });
      
      expect(result.current.questState.quests).toHaveLength(0);
    });

    it('ignores None narrative', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.updateQuestFromNarrative('None');
      });
      
      expect(result.current.questState.quests).toHaveLength(0);
    });

    it('ignores empty narrative', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.updateQuestFromNarrative('');
      });
      
      expect(result.current.questState.quests).toHaveLength(0);
    });

    it('sets matching existing quest as active', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Find the Artifact', 'Locate it');
        result.current.addQuest('Another Quest', 'Different');
      });
      
      const firstQuestId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.setActiveQuest(result.current.questState.quests[1].id);
      });
      
      act(() => {
        result.current.updateQuestFromNarrative('Find the Artifact');
      });
      
      expect(result.current.questState.activeQuestId).toBe(firstQuestId);
    });
  });

  describe('getQuestProgress', () => {
    it('returns 0 for quest with no objectives', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'No objectives');
      });
      
      const questId = result.current.questState.quests[0].id;
      expect(result.current.getQuestProgress(questId)).toBe(0);
    });

    it('returns 0 for non-existent quest', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      expect(result.current.getQuestProgress('fake-id')).toBe(0);
    });

    it('calculates correct progress percentage', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'With objectives', QuestType.Main, ['A', 'B', 'C', 'D']);
      });
      
      const quest = result.current.questState.quests[0];
      
      act(() => {
        result.current.completeObjective(quest.id, quest.objectives[0].id);
        result.current.completeObjective(quest.id, quest.objectives[1].id);
      });
      
      expect(result.current.getQuestProgress(quest.id)).toBe(50);
    });

    it('returns 100 when all objectives complete', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest', 'One objective', QuestType.Main, ['Only one']);
      });
      
      const quest = result.current.questState.quests[0];
      
      act(() => {
        result.current.completeObjective(quest.id, quest.objectives[0].id);
      });
      
      expect(result.current.getQuestProgress(quest.id)).toBe(100);
    });
  });

  describe('computed values', () => {
    it('activeQuest returns current active quest', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Active Quest', 'Currently active');
      });
      
      expect(result.current.activeQuest?.title).toBe('Active Quest');
    });

    it('activeQuest returns null when no active quest', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      expect(result.current.activeQuest).toBeNull();
    });

    it('activeQuests filters only active quests', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Active 1', 'First');
        result.current.addQuest('Active 2', 'Second');
      });
      
      const firstId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.completeQuest(firstId);
      });
      
      expect(result.current.activeQuests).toHaveLength(1);
      expect(result.current.activeQuests[0].title).toBe('Active 2');
    });

    it('completedQuests filters only completed quests', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Quest 1', 'First');
        result.current.addQuest('Quest 2', 'Second');
      });
      
      const firstId = result.current.questState.quests[0].id;
      
      act(() => {
        result.current.completeQuest(firstId);
      });
      
      expect(result.current.completedQuests).toHaveLength(1);
      expect(result.current.completedQuests[0].title).toBe('Quest 1');
    });

    it('mainQuests filters by type', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Main', 'Main quest', QuestType.Main);
        result.current.addQuest('Side', 'Side quest', QuestType.Side);
      });
      
      expect(result.current.mainQuests).toHaveLength(1);
      expect(result.current.mainQuests[0].title).toBe('Main');
    });

    it('sideQuests filters by type', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      act(() => {
        result.current.addQuest('Main', 'Main quest', QuestType.Main);
        result.current.addQuest('Side', 'Side quest', QuestType.Side);
      });
      
      expect(result.current.sideQuests).toHaveLength(1);
      expect(result.current.sideQuests[0].title).toBe('Side');
    });
  });

  describe('loadQuestState', () => {
    it('loads saved quest state', () => {
      const { result } = renderHook(() => useQuestSystem());
      
      const savedState: QuestState = {
        quests: [
          {
            id: 'saved-quest',
            title: 'Saved Quest',
            description: 'From save',
            type: QuestType.Main,
            status: QuestStatus.Active,
            objectives: [],
            startedAt: 12345
          }
        ],
        activeQuestId: 'saved-quest'
      };
      
      act(() => {
        result.current.loadQuestState(savedState);
      });
      
      expect(result.current.questState).toEqual(savedState);
    });
  });
});

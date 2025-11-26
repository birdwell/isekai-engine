import { useState, useCallback, useEffect, useRef } from 'react';
import { GameResponse, MediaItem, QuestStatus, QuestSystem } from '../types';
import { 
  GameMasterAgent, 
  createGameMaster, 
  GameMemory,
  saveMemory,
  clearMemory,
} from '@/services/agent';

const AUTO_SAVE_INTERVAL = 60000;
const SAVE_KEY = 'isekai_agent_save';

interface SaveData {
  memory: GameMemory;
  lastResponse: GameResponse | null;
  gallery: MediaItem[];
  turnCount: number;
  timestamp: number;
}

export const useGameAgent = (hasApiKey: boolean) => {
  const [lastResponse, setLastResponse] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);

  const agentRef = useRef<GameMasterAgent | null>(null);
  const galleryRef = useRef<MediaItem[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastResponseRef = useRef(lastResponse);

  useEffect(() => {
    lastResponseRef.current = lastResponse;
  }, [lastResponse]);

  const getAgent = useCallback(() => {
    if (!agentRef.current) {
      agentRef.current = createGameMaster();
    }
    return agentRef.current;
  }, []);

  const saveGame = useCallback((gallery: MediaItem[], isAutoSave = false) => {
    try {
      if (isAutoSave) {
        setSaveStatus('saving');
      }
      
      const agent = getAgent();
      const saveData: SaveData = {
        memory: agent.getMemory(),
        lastResponse: lastResponseRef.current,
        gallery,
        turnCount: agent.getTurnCount(),
        timestamp: Date.now(),
      };
      
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      saveMemory(agent.getMemory());
      
      setSaveStatus('saved');
      if (isAutoSave) {
        setLastAutoSave(Date.now());
      }
      setTimeout(() => setSaveStatus('idle'), 2000);
      return true;
    } catch (e) {
      console.error("Save failed", e);
      setSaveStatus('idle');
      return false;
    }
  }, [getAgent]);

  const loadGame = useCallback(() => {
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (!savedData) return false;

      const parsed: SaveData = JSON.parse(savedData);
      const agent = getAgent();
      
      agent.loadState(
        parsed.memory,
        parsed.lastResponse?.status || null,
        agent.getQuests(),
        parsed.turnCount
      );
      
      setLastResponse(parsed.lastResponse);
      setGameStarted(true);
      return true;
    } catch (e) {
      console.error("Failed to load save:", e);
      return false;
    }
  }, [getAgent]);

  const startNewGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    clearMemory();
    agentRef.current = null;
    window.location.reload();
  }, []);

  const performAutoSave = useCallback(() => {
    if (gameStarted && lastResponseRef.current && !loading) {
      saveGame(galleryRef.current, true);
    }
  }, [gameStarted, loading, saveGame]);

  useEffect(() => {
    if (!gameStarted || !hasApiKey) return;

    autoSaveTimerRef.current = setInterval(() => {
      performAutoSave();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [gameStarted, hasApiKey, performAutoSave]);

  useEffect(() => {
    if (!hasApiKey) return;

    const loaded = loadGame();
    
    if (!loaded && !gameStarted) {
      setGameStarted(true);
      handleTurn("Initialize simulation. Introduce yourself as The Administrator in the Divine Realm.");
    }
  }, [hasApiKey]);

  const handleTurn = useCallback(async (userAction: string) => {
    setLoading(true);

    try {
      const agent = getAgent();
      const agentResponse = await agent.processInput(userAction);
      
      const gameResponse: GameResponse = {
        scenePrompt: agentResponse.scenePrompt,
        narrative: agentResponse.narrative,
        status: agentResponse.status,
        choices: agentResponse.choices,
        rawText: JSON.stringify(agentResponse),
      };
      
      setLastResponse(gameResponse);

      if (agent.getTurnCount() % 5 === 0 && galleryRef.current.length > 0) {
        saveGame(galleryRef.current, true);
      }
    } catch (error) {
      console.error("Game Turn Error:", error);
    } finally {
      setLoading(false);
    }
  }, [getAgent, saveGame]);

  const setGalleryRef = useCallback((gallery: MediaItem[]) => {
    galleryRef.current = gallery;
  }, []);

  const agent = getAgent();
  const quests = agent.getQuests();
  const activeQuestId = quests.find(q => q.status === QuestStatus.Active)?.id || null;
  const activeQuest = quests.find(q => q.id === activeQuestId) || null;

  const getQuestProgress = useCallback((questId: string): number => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return 0;
    const completed = quest.objectives.filter(o => o.isCompleted).length;
    const total = quest.objectives.length;
    return total > 0 ? (completed / total) * 100 : 0;
  }, [quests]);

  const setActiveQuest = useCallback((_questId: string | null) => {
    // In the agent-based system, quest selection is handled by the agent
    // This is a no-op for compatibility
  }, []);

  const questSystem: QuestSystem = {
    activeQuest,
    questState: {
      quests,
      activeQuestId,
    },
    setActiveQuest,
    getQuestProgress,
  };

  return {
    lastResponse,
    loading,
    questLog: quests.map(q => q.title),
    quests,
    questSystem,
    memory: agent.getMemory(),
    saveStatus,
    gameStarted,
    lastAutoSave,
    handleTurn,
    saveGame,
    loadGame,
    startNewGame,
    setGalleryRef,
  };
};

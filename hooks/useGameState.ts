import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, GameResponse, MediaItem, QuestState } from '../types';
import { generateAdventureText } from '@/services/gemini';
import { parseGameResponse } from '../utils/parser';
import { useQuestSystem } from './useQuestSystem';

const AUTO_SAVE_INTERVAL = 60000; // Auto-save every 60 seconds
const SAVE_KEY = 'isekai_save';

export const useGameState = (hasApiKey: boolean) => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [lastResponse, setLastResponse] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);
  
  const questSystem = useQuestSystem();
  const galleryRef = useRef<MediaItem[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnCountRef = useRef<number>(0);
  
  const historyRef = useRef(history);
  const lastResponseRef = useRef(lastResponse);
  const questStateRef = useRef(questSystem.questState);
  
  useEffect(() => {
    historyRef.current = history;
    lastResponseRef.current = lastResponse;
    questStateRef.current = questSystem.questState;
  }, [history, lastResponse, questSystem.questState]);

  const saveGame = useCallback((gallery: MediaItem[], isAutoSave = false) => {
    try {
      if (isAutoSave) {
        setSaveStatus('saving');
      }
      
      const saveData = {
        history: historyRef.current,
        lastResponse: lastResponseRef.current,
        gallery,
        questState: questStateRef.current,
        timestamp: Date.now(),
        turnCount: turnCountRef.current
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      
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
  }, []);

  const loadGame = useCallback(() => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return false;

    try {
      const parsed = JSON.parse(savedData);
      if (parsed.history && Array.isArray(parsed.history)) {
        setHistory(parsed.history);
        setLastResponse(parsed.lastResponse);
        if (parsed.questState) {
          questSystem.loadQuestState(parsed.questState);
        }
        if (parsed.turnCount) {
          turnCountRef.current = parsed.turnCount;
        }
        setGameStarted(true);
        return true;
      }
    } catch (e) {
      console.error("Failed to load save:", e);
    }
    return false;
  }, [questSystem]);

  const startNewGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  }, []);

  const performAutoSave = useCallback(() => {
    if (gameStarted && history.length > 0 && !loading) {
      saveGame(galleryRef.current, true);
    }
  }, [gameStarted, history.length, loading, saveGame]);

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
    turnCountRef.current += 1;
    
    const newHistory: ChatMessage[] = [
      ...history,
      { role: 'user', text: userAction }
    ];
    setHistory(newHistory);

    try {
      const textResponse = await generateAdventureText(history, userAction);
      const parsed = parseGameResponse(textResponse);
      
      setLastResponse(parsed);
      setHistory(prev => [...prev, { role: 'model', text: textResponse }]);

      if (parsed.status?.activeQuest) {
        questSystem.updateQuestFromNarrative(parsed.status.activeQuest);
      }

      if (turnCountRef.current % 5 === 0 && galleryRef.current.length > 0) {
        saveGame(galleryRef.current, true);
      }
    } catch (error) {
      console.error("Game Turn Error:", error);
    } finally {
      setLoading(false);
    }
  }, [history, questSystem, saveGame]);

  const setGalleryRef = useCallback((gallery: MediaItem[]) => {
    galleryRef.current = gallery;
  }, []);

  return {
    history,
    lastResponse,
    loading,
    questLog: questSystem.questState.quests.map(q => q.title),
    questSystem,
    saveStatus,
    gameStarted,
    lastAutoSave,
    handleTurn,
    saveGame,
    loadGame,
    startNewGame,
    setGalleryRef
  };
};

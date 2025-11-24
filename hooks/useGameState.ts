
import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, GameResponse, MediaItem } from '../types';
import { generateAdventureText } from '../services/geminiService';
import { parseGameResponse } from '../utils/parser';

export const useGameState = (hasApiKey: boolean) => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [lastResponse, setLastResponse] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [questLog, setQuestLog] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Load Game Logic
  const loadGame = useCallback(() => {
    const savedData = localStorage.getItem('isekai_save');
    if (!savedData) return false;

    try {
      const parsed = JSON.parse(savedData);
      if (parsed.history && Array.isArray(parsed.history)) {
        setHistory(parsed.history);
        setLastResponse(parsed.lastResponse);
        setQuestLog(parsed.questLog || []);
        setGameStarted(true);
        // Note: Gallery loading is handled by useMediaEngine reading the same localstorage key
        return true;
      }
    } catch (e) {
      console.error("Failed to load save:", e);
    }
    return false;
  }, []);

  // Save Game Logic
  const saveGame = useCallback((gallery: MediaItem[]) => {
    try {
      const saveData = {
        history,
        lastResponse,
        gallery, // Save the full history of images
        questLog,
        timestamp: Date.now()
      };
      localStorage.setItem('isekai_save', JSON.stringify(saveData));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return true;
    } catch (e) {
      console.error("Save failed", e);
      return false;
    }
  }, [history, lastResponse, questLog]);

  const startNewGame = useCallback(() => {
     localStorage.removeItem('isekai_save');
     window.location.reload();
  }, []);

  // Auto-init game on boot
  useEffect(() => {
    if (!hasApiKey) return;

    // Try to auto-load
    const loaded = loadGame();
    
    // If no save, start fresh
    if (!loaded && !gameStarted) {
      setGameStarted(true);
      handleTurn("Initialize simulation. Introduce yourself as The Administrator in the Divine Realm.");
    }
  }, [hasApiKey]); // Only run when we have a key

  // The Core Game Loop
  const handleTurn = useCallback(async (userAction: string) => {
    setLoading(true);
    
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

      // Update Quest Log
      if (parsed.status?.activeQuest) {
         setQuestLog(prev => {
             const current = parsed.status?.activeQuest || "";
             if (current !== "Unknown" && current !== prev[prev.length - 1]) {
                 return [...prev, current];
             }
             return prev;
         });
      }
    } catch (error) {
      console.error("Game Turn Error:", error);
    } finally {
      setLoading(false);
    }
  }, [history]);

  return {
    history,
    lastResponse,
    loading,
    questLog,
    saveStatus,
    gameStarted,
    handleTurn,
    saveGame,
    loadGame,
    startNewGame
  };
};

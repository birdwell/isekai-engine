import React, { useState, useEffect } from 'react';
import { StatusPanel } from '@/components/StatusPanel';
import { NarrativeDisplay } from '@/components/NarrativeDisplay';
import { ActionPanel } from '@/components/ActionPanel';
import { Visualizer } from '@/components/Visualizer';
import { SettingsModal } from '@/components/SettingsModal';
import { NotificationToast } from '@/components/NotificationToast';
import { AppHeader } from '@/components/AppHeader';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthScreen } from '@/components/AuthScreen';
import { useGameAgent } from '@/hooks/useGameAgent';
import { useNotification } from '@/hooks/useNotification';
import { useApiKeyAuth } from '@/hooks/useApiKeyAuth';
import { shutdownLangfuse, setLangfuseUserId, setLangfuseSessionId } from '@/services/langfuse';
import { useUserContext } from '@/contexts/UserContext';
import { useMediaEngineContext } from '@/contexts/MediaEngineContext';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { userId, sessionId, startNewSession } = useUserContext();
  const { hasApiKey, isCheckingKey, handleSelectKey } = useApiKeyAuth();
  const { notification, showNotification } = useNotification();
  const mediaEngine = useMediaEngineContext();

  const gameState = useGameAgent(hasApiKey);

  useEffect(() => {
    setLangfuseUserId(userId);
  }, [userId]);

  useEffect(() => {
    setLangfuseSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => {
    mediaEngine.setScenePrompt(gameState.lastResponse?.scenePrompt);
  }, [gameState.lastResponse?.scenePrompt, mediaEngine.setScenePrompt]);

  useEffect(() => {
    gameState.setGalleryRef(mediaEngine.gallery);
  }, [mediaEngine.gallery, gameState.setGalleryRef]);

  useEffect(() => {
    return () => {
      shutdownLangfuse();
    };
  }, []);

  const handleSave = () => {
    const success = gameState.saveGame(mediaEngine.gallery);
    if (success) showNotification("Game Saved");
    else showNotification("Save Failed", 'error');
  };

  const handleLoad = () => {
    if (window.confirm("Load previous save? Unsaved progress will be lost.")) {
      const success = gameState.loadGame();
      if (success) {
        showNotification("Game Loaded");
        setTimeout(() => window.location.reload(), 500);
      } else {
        showNotification("No save found", 'error');
      }
    }
  };

  const handleNewGame = () => {
    if (window.confirm("Start new game? This deletes your current save.")) {
      startNewSession();
      gameState.startNewGame();
    }
  };

  const handleGenerateVideo = async () => {
    showNotification("Rendering cinematic... (~1 min)", 'success');
    const success = await mediaEngine.generateVideo();
    if (success) showNotification("Cinematic ready!", 'success');
    else showNotification("Video generation failed", 'error');
  };

  if (isCheckingKey) {
    return <LoadingScreen />;
  }

  if (!hasApiKey) {
    return <AuthScreen onSelectKey={handleSelectKey} />;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col font-sans">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
      />

      <NotificationToast notification={notification} />

      <AppHeader
        lastAutoSave={gameState.lastAutoSave}
        saveStatus={gameState.saveStatus}
        canSave={!!gameState.lastResponse}
        loading={gameState.loading}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSave={handleSave}
        onLoad={handleLoad}
        onNewGame={handleNewGame}
      />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        <div className="flex flex-col w-full md:w-[380px] lg:w-[480px] bg-slate-900/50 border-r border-slate-800 shrink-0 overflow-y-auto custom-scrollbar">
          <Visualizer onGenerateVideo={handleGenerateVideo} />
          <div className="flex-1 relative">
            <StatusPanel
              status={gameState.lastResponse?.status || null} 
              onUseItem={(item) => !gameState.loading && gameState.handleTurn(`I use the ${item}.`)}
              questSystem={gameState.questSystem}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col relative min-w-0 bg-slate-950">
          <div className="flex-1 overflow-y-auto scroll-smooth flex flex-col custom-scrollbar">
            <NarrativeDisplay 
              response={gameState.lastResponse} 
              isLoading={gameState.loading} 
            />
          </div>
          
          <ActionPanel 
            choices={gameState.lastResponse?.choices || []} 
            onChoiceSelect={gameState.handleTurn}
            disabled={gameState.loading}
          />
        </div>

      </main>
    </div>
  );
}

export default App;

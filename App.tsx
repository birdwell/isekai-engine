import React, { useState, useEffect } from 'react';
import { StatusPanel } from '@/components/StatusPanel';
import { NarrativeDisplay } from '@/components/NarrativeDisplay';
import { ActionPanel } from '@/components/ActionPanel';
import { Visualizer } from '@/components/Visualizer';
import { SettingsModal } from '@/components/SettingsModal';
import { NotificationToast, Notification } from '@/components/NotificationToast';
import { AppHeader } from '@/components/AppHeader';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthScreen } from '@/components/AuthScreen';
import { useGameState } from './hooks/useGameState';
import { useMediaEngine } from './hooks/useMediaEngine';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [imageQuality, setImageQuality] = useState<'fast' | 'quality'>('fast');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  const [notification, setNotification] = useState<Notification | null>(null);

  const gameState = useGameState(hasApiKey);
  const mediaEngine = useMediaEngine(gameState.lastResponse?.scenePrompt, imageQuality);

  useEffect(() => {
    gameState.setGalleryRef(mediaEngine.gallery);
  }, [mediaEngine.gallery, gameState.setGalleryRef]);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } catch(e) {
        console.error(e);
      }
    }
  };

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
      gameState.startNewGame();
    }
  };

  const handleGenerateVideo = async () => {
    showNotification("Rendering cinematic... (~1 min)", 'success');
    const success = await mediaEngine.generateVideo();
    if (success) showNotification("Cinematic ready!", 'success');
    else showNotification("Video generation failed", 'error');
  };

  useEffect(() => {
    const checkKey = async () => {
      try {
        if ((window as any).aistudio) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

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
        quality={imageQuality}
        setQuality={setImageQuality}
        autoPaint={mediaEngine.autoPaint}
        setAutoPaint={mediaEngine.setAutoPaint}
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
          <Visualizer 
            mediaItem={mediaEngine.currentMedia} 
            gallerySize={mediaEngine.gallery.length}
            currentIndex={mediaEngine.currentIndex}
            loading={mediaEngine.imageLoading} 
            videoLoading={mediaEngine.videoLoading}
            onGenerateVideo={handleGenerateVideo}
            onPaintScene={mediaEngine.generateImageForScene}
            onRegenerate={mediaEngine.regenerateCurrent}
            canPaintNew={mediaEngine.canPaintNew}
            onNext={mediaEngine.nextImage}
            onPrev={mediaEngine.prevImage}
          />
          <div className="flex-1 relative">
            <StatusPanel 
              status={gameState.lastResponse?.status || null} 
              onUseItem={(item) => !gameState.loading && gameState.handleTurn(`I use the ${item}.`)}
              activeQuest={gameState.questSystem.activeQuest}
              quests={gameState.questSystem.questState.quests}
              activeQuestId={gameState.questSystem.questState.activeQuestId}
              onSetActiveQuest={gameState.questSystem.setActiveQuest}
              getQuestProgress={gameState.questSystem.getQuestProgress}
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

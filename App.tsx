
import React, { useState, useEffect } from 'react';
import { StatusPanel } from './components/StatusPanel';
import { NarrativeDisplay } from './components/NarrativeDisplay';
import { ActionPanel } from './components/ActionPanel';
import { Visualizer } from './components/Visualizer';
import { SettingsModal } from './components/SettingsModal';
import { useGameState } from './hooks/useGameState';
import { useMediaEngine } from './hooks/useMediaEngine';
import { Terminal, Save, RotateCcw, CheckCircle, FolderOpen, AlertCircle, Settings, Lock } from 'lucide-react';

function App() {
  // --- 1. Global App State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [imageQuality, setImageQuality] = useState<'fast' | 'quality'>('fast');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- 2. Custom Hooks (Logic Layers) ---
  const gameState = useGameState(hasApiKey);
  const mediaEngine = useMediaEngine(gameState.lastResponse?.scenePrompt, imageQuality);

  // --- 3. Notification Helper ---
  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- 4. Event Handlers ---
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
      // We pass the full gallery to save
      const success = gameState.saveGame(mediaEngine.gallery);
      if (success) showNotification("Game Saved");
      else showNotification("Save Failed", 'error');
  };

  const handleLoad = () => {
      if (window.confirm("Load previous save? Unsaved progress will be lost.")) {
          const success = gameState.loadGame();
          // Note: Gallery loads automatically via localstorage hook in useMediaEngine
          // But to be safe, a reload is often cleaner in this architecture or we'd need to expose a setGallery on mediaEngine
          if (success) {
              showNotification("Game Loaded");
              setTimeout(() => window.location.reload(), 500); // Reload to sync all hooks
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

  // Check API Key on mount
  useEffect(() => {
    const checkKey = async () => {
        try {
            if ((window as any).aistudio) {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
            } else {
                setHasApiKey(true); // Dev fallback
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCheckingKey(false);
        }
    };
    checkKey();
  }, []);


  // --- 5. Render Views ---

  if (isCheckingKey) {
      return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-amber-500">Initializing System...</div>;
  }

  if (!hasApiKey) {
      return (
          <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/50 mb-4 animate-pulse">
                  <Lock className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-4xl font-serif font-bold text-amber-100">AUTHENTICATION REQUIRED</h1>
              <p className="text-slate-400 max-w-md">
                  Access to the Isekai Engine requires a valid Neural Link (API Key). <br/>
                  High-fidelity world generation and time manipulation features are enabled.
              </p>
              <button 
                onClick={handleSelectKey}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2"
              >
                  <Terminal className="w-5 h-5" />
                  CONNECT NEURAL LINK
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-amber-500 underline">
                  Acquire Access Key
              </a>
          </div>
      );
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

      {notification && (
        <div className={`
          fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg border flex items-center gap-3 animate-fade-in transition-all
          ${notification.type === 'success' ? 'bg-slate-800 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-red-500/50 text-red-400'}
        `}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm tracking-wide">{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 justify-between shrink-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 p-2 rounded-lg shadow-lg shadow-amber-900/20">
             <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl tracking-wider text-amber-100 hidden md:block text-shadow-sm">ISEKAI ENGINE</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">System Online v3.1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition-colors mr-2"
            title="System Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={handleSave}
            disabled={!gameState.lastResponse || gameState.loading}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider
              ${gameState.saveStatus === 'saved' 
                ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' 
                : 'bg-slate-800 hover:bg-amber-900/30 hover:border-amber-700 text-slate-300 hover:text-amber-400 border-slate-700'
              }
              ${(!gameState.lastResponse || gameState.loading) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {gameState.saveStatus === 'saved' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="hidden md:inline">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="hidden md:inline">Save</span>
              </>
            )}
          </button>

          <button
            onClick={handleLoad}
            disabled={gameState.loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-blue-900/30 text-slate-300 hover:text-blue-400 rounded-md border border-slate-700 hover:border-blue-800 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden md:inline">Load</span>
          </button>

          <button
            onClick={handleNewGame}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 rounded-md border border-slate-700 hover:border-red-800 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Restart</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar: Visuals & Stats */}
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
                  questLog={gameState.questLog}
              />
          </div>
        </div>

        {/* Right Area: Narrative & Actions */}
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

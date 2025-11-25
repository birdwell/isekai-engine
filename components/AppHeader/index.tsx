import React from 'react';
import { Terminal, Save, RotateCcw, CheckCircle, FolderOpen, Settings, Cloud } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved';

interface AppHeaderProps {
  lastAutoSave: number | null;
  saveStatus: SaveStatus;
  canSave: boolean;
  loading: boolean;
  onOpenSettings: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNewGame: () => void;
}

const formatAutoSaveTime = (timestamp: number | null) => {
  if (!timestamp) return null;
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  lastAutoSave,
  saveStatus,
  canSave,
  loading,
  onOpenSettings,
  onSave,
  onLoad,
  onNewGame,
}) => {
  return (
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
        {lastAutoSave && (
          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-500 mr-2">
            <Cloud className="w-3 h-3" />
            <span>Auto-saved {formatAutoSaveTime(lastAutoSave)}</span>
          </div>
        )}

        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition-colors mr-2"
          title="System Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={onSave}
          disabled={!canSave || loading}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider
            ${saveStatus === 'saved' 
              ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' 
              : saveStatus === 'saving'
              ? 'bg-blue-900/30 text-blue-400 border-blue-800'
              : 'bg-slate-800 hover:bg-amber-900/30 hover:border-amber-700 text-slate-300 hover:text-amber-400 border-slate-700'
            }
            ${(!canSave || loading) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {saveStatus === 'saved' ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span className="hidden md:inline">Saved</span>
            </>
          ) : saveStatus === 'saving' ? (
            <>
              <Cloud className="w-4 h-4 animate-pulse" />
              <span className="hidden md:inline">Saving</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span className="hidden md:inline">Save</span>
            </>
          )}
        </button>

        <button
          onClick={onLoad}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-blue-900/30 text-slate-300 hover:text-blue-400 rounded-md border border-slate-700 hover:border-blue-800 transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden md:inline">Load</span>
        </button>

        <button
          onClick={onNewGame}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 rounded-md border border-slate-700 hover:border-red-800 transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Restart</span>
        </button>
      </div>
    </header>
  );
};

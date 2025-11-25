import React from 'react';
import { Terminal, Lock } from 'lucide-react';

interface AuthScreenProps {
  onSelectKey: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSelectKey }) => {
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
        onClick={onSelectKey}
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
};

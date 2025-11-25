import React, { useState } from 'react';
import { Send, Sword } from 'lucide-react';

interface ActionInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
}

export const ActionInput: React.FC<ActionInputProps> = ({ onSubmit, disabled }) => {
  const [customInput, setCustomInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onSubmit(customInput);
      setCustomInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Sword className={`w-5 h-5 ${disabled ? 'text-slate-600' : 'text-slate-400'}`} />
      </div>
      <input
        type="text"
        value={customInput}
        onChange={(e) => setCustomInput(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "Waiting for narrator..." : "Declare your action..."}
        className={`
          w-full bg-slate-950 border rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500/50
          ${disabled ? 'border-slate-800 text-slate-600 cursor-not-allowed' : 'border-slate-700 text-slate-200'}
        `}
      />
      <button
        type="submit"
        disabled={disabled || !customInput.trim()}
        className={`
          absolute inset-y-1 right-1 px-3 rounded-md flex items-center transition-colors
          ${disabled || !customInput.trim() ? 'text-slate-600' : 'bg-amber-600 text-white hover:bg-amber-500'}
        `}
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};

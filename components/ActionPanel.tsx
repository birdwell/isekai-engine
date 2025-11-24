import React, { useState } from 'react';
import { Choice } from '../types';
import { Send, Sword } from 'lucide-react';

interface ActionPanelProps {
  choices: Choice[];
  onChoiceSelect: (text: string) => void;
  disabled: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ choices, onChoiceSelect, disabled }) => {
  const [customInput, setCustomInput] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onChoiceSelect(customInput);
      setCustomInput('');
    }
  };

  // Simple Markdown parser function (matching NarrativeDisplay)
  const renderMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="text-amber-400 font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx} className="text-amber-200 italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="bg-slate-900 border-t border-slate-700 p-4 md:p-6 flex-shrink-0">
      <div className="max-w-5xl mx-auto">
        
        {/* Quick Choices Grid */}
        {choices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onChoiceSelect(choice.text)}
                disabled={disabled}
                className={`
                  text-left px-4 py-3 rounded-lg border transition-all duration-200 group
                  ${disabled 
                    ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-800/50 border-slate-600 hover:bg-amber-900/20 hover:border-amber-500/50 hover:text-amber-100 text-slate-300'
                  }
                `}
              >
                <span className="font-bold text-amber-500 mr-3 group-hover:text-amber-400">{choice.id}.</span>
                <span>{renderMarkdown(choice.text)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Field */}
        <form onSubmit={handleCustomSubmit} className="relative">
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
      </div>
    </div>
  );
};
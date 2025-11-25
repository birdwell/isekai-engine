import React from 'react';
import { Choice } from '@/types';
import { renderMarkdown } from '@/utils/markdown';

interface ChoiceButtonProps {
  choice: Choice;
  onClick: () => void;
  disabled: boolean;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({ choice, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
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
  );
};

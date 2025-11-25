import React from 'react';
import { Choice } from '@/types';
import { ChoicesGrid } from './ChoicesGrid';
import { ActionInput } from './ActionInput';

interface ActionPanelProps {
  choices: Choice[];
  onChoiceSelect: (text: string) => void;
  disabled: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ choices, onChoiceSelect, disabled }) => {
  return (
    <div className="bg-slate-900 border-t border-slate-700 p-4 md:p-6 flex-shrink-0">
      <div className="max-w-5xl mx-auto">
        <ChoicesGrid choices={choices} onChoiceSelect={onChoiceSelect} disabled={disabled} />
        <ActionInput onSubmit={onChoiceSelect} disabled={disabled} />
      </div>
    </div>
  );
};

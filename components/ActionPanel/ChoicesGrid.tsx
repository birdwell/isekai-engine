import React from 'react';
import { Choice } from '@/types';
import { ChoiceButton } from './ChoiceButton';

interface ChoicesGridProps {
  choices: Choice[];
  onChoiceSelect: (text: string) => void;
  disabled: boolean;
}

export const ChoicesGrid: React.FC<ChoicesGridProps> = ({ choices, onChoiceSelect, disabled }) => {
  if (choices.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      {choices.map((choice) => (
        <ChoiceButton
          key={choice.id}
          choice={choice}
          onClick={() => onChoiceSelect(choice.text)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

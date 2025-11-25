import React from 'react';
import { renderMarkdown } from '@/utils/markdown';

interface StoryTextProps {
  narrative: string;
}

export const StoryText: React.FC<StoryTextProps> = ({ narrative }) => {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      {narrative.split('\n').map((paragraph, idx) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;
        return (
          <p key={idx} className="leading-relaxed text-slate-200">
            {renderMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

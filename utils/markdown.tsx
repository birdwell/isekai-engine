import React from 'react';

export const renderMarkdown = (text: string) => {
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

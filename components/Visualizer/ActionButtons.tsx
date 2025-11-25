import React from 'react';
import { RefreshCw, Clapperboard } from 'lucide-react';
import { IconButton } from '@/components/ui';

interface ActionButtonsProps {
  hasVideo: boolean;
  onRegenerate: () => void;
  onGenerateVideo: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  hasVideo,
  onRegenerate,
  onGenerateVideo
}) => {
  if (hasVideo) return null;

  return (
    <div className="flex justify-end gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
      <IconButton
        onClick={onRegenerate}
        icon={<RefreshCw className="w-5 h-5" />}
        title="Redraw / Variant"
      />
      <IconButton
        onClick={onGenerateVideo}
        icon={<Clapperboard className="w-5 h-5" />}
        title="Animate Scene (Veo)"
        variant="primary"
      />
    </div>
  );
};

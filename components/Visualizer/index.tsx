import React from 'react';
import { MediaItem } from '@/types';
import { LoadingSpinner } from '@/components/ui';
import { EmptyState } from './EmptyState';
import { MediaDisplay } from './MediaDisplay';
import { GalleryNavigation } from './GalleryNavigation';
import { NewSceneBadge } from './NewSceneBadge';
import { ActionButtons } from './ActionButtons';
import { ScanlineOverlay } from './ScanlineOverlay';

interface VisualizerProps {
  mediaItem: MediaItem | null;
  loading: boolean;
  videoLoading: boolean;
  onGenerateVideo: () => void;
  onPaintScene: () => void;
  onRegenerate: () => void;
  canPaintNew: boolean | undefined;
  gallerySize: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({ 
  mediaItem,
  loading, 
  videoLoading, 
  onGenerateVideo,
  onPaintScene,
  onRegenerate,
  canPaintNew,
  gallerySize,
  currentIndex,
  onNext,
  onPrev
}) => {
  const loadingMessage = videoLoading ? 'Rendering Animation...' : 'Painting Scene...';
  const isLoading = loading || videoLoading;

  return (
    <div className="relative w-full aspect-square flex-shrink-0 bg-black border-b border-slate-700 overflow-hidden group shadow-2xl">
      
      {isLoading && <LoadingSpinner message={loadingMessage} />}

      {!mediaItem && !loading && <EmptyState onPaintScene={onPaintScene} canPaint={!!canPaintNew} />}

      {mediaItem && <MediaDisplay mediaItem={mediaItem} loading={loading} />}
      
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4">
        <div className="flex justify-between items-start pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <GalleryNavigation
            gallerySize={gallerySize}
            currentIndex={currentIndex}
            onNext={onNext}
            onPrev={onPrev}
          />
          
          {canPaintNew && !loading && <NewSceneBadge onClick={onPaintScene} />}
        </div>

        {mediaItem && !isLoading && (
          <ActionButtons
            hasVideo={!!mediaItem.videoUrl}
            onRegenerate={onRegenerate}
            onGenerateVideo={onGenerateVideo}
          />
        )}
      </div>

      {!mediaItem?.videoUrl && <ScanlineOverlay />}
    </div>
  );
};

import React from 'react';

enum ViewState {
  Loading = 'loading',
  Media = 'media',
  Empty = 'empty',
}
import { LoadingSpinner } from '@/components/ui';
import { EmptyState } from './EmptyState';
import { MediaDisplay } from './MediaDisplay';
import { GalleryNavigation } from './GalleryNavigation';
import { NewSceneBadge } from './NewSceneBadge';
import { ActionButtons } from './ActionButtons';
import { ScanlineOverlay } from './ScanlineOverlay';
import { useMediaEngineContext } from '@/contexts/MediaEngineContext';

interface VisualizerProps {
  onGenerateVideo: () => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({ 
  onGenerateVideo,
}) => {
  const { gallery, currentIndex, currentMedia, imageLoading, videoLoading, generateImageForScene, regenerateCurrent, nextImage, prevImage, canPaintNew } = useMediaEngineContext();
  const loadingMessage = videoLoading ? 'Rendering Animation...' : 'Painting Scene...';
  const isLoading = imageLoading || videoLoading;

  const viewState = isLoading ? ViewState.Loading 
    : currentMedia ? ViewState.Media 
    : ViewState.Empty;

  const showNewSceneBadge = viewState === ViewState.Media && canPaintNew;
  const showActionButtons = viewState === ViewState.Media;
  const showScanlines = !currentMedia?.videoUrl;

  return (
    <div className="relative w-full aspect-square flex-shrink-0 bg-black border-b border-slate-700 overflow-hidden group shadow-2xl">
      
      {viewState === ViewState.Loading && <LoadingSpinner message={loadingMessage} />}
      {viewState === ViewState.Empty && <EmptyState onPaintScene={generateImageForScene} canPaint={!!canPaintNew} />}
      {viewState === ViewState.Media && <MediaDisplay mediaItem={currentMedia!} loading={false} />}
      
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4">
        <div className="flex justify-between items-start pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <GalleryNavigation
            gallerySize={gallery.length}
            currentIndex={currentIndex}
            onNext={nextImage}
            onPrev={prevImage}
          />
          
          {showNewSceneBadge && <NewSceneBadge onClick={generateImageForScene} />}
        </div>

        {showActionButtons && (
          <ActionButtons
            hasVideo={!!currentMedia!.videoUrl}
            onRegenerate={regenerateCurrent}
            onGenerateVideo={onGenerateVideo}
          />
        )}
      </div>

      {showScanlines && <ScanlineOverlay />}
    </div>
  );
};

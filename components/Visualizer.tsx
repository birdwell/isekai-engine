
import React, { useRef, useEffect } from 'react';
import { ImageIcon, Clapperboard, RefreshCw, ChevronLeft, ChevronRight, Paintbrush } from 'lucide-react';
import { MediaItem } from '../types';

interface VisualizerProps {
  mediaItem: MediaItem | null;
  loading: boolean;
  videoLoading: boolean;
  onGenerateVideo: () => void;
  onPaintScene: () => void; // Generates new image for current text
  onRegenerate: () => void; // Rerolls current image
  canPaintNew: boolean | undefined;
  
  // Gallery Props
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
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (mediaItem?.videoUrl && videoRef.current) {
            videoRef.current.play();
        }
    }, [mediaItem]);

  return (
    <div className="relative w-full aspect-square flex-shrink-0 bg-black border-b border-slate-700 overflow-hidden group shadow-2xl">
      
      {/* Loading Overlay */}
      {(loading || videoLoading) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-2"></div>
          <span className="text-xs text-amber-500 font-mono tracking-widest uppercase animate-pulse">
            {videoLoading ? 'Rendering Animation...' : 'Painting Scene...'}
          </span>
        </div>
      )}

      {/* Empty State */}
      {!mediaItem && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
          <ImageIcon className="w-12 h-12 mb-4 opacity-30" />
          <span className="text-sm uppercase tracking-widest mb-4">No Visual Data</span>
          <button 
             onClick={onPaintScene}
             className="px-4 py-2 bg-slate-800 hover:bg-amber-700 text-slate-300 hover:text-white rounded border border-slate-700 hover:border-amber-500 transition-all flex items-center gap-2"
          >
             <Paintbrush className="w-4 h-4" />
             <span>Paint This Scene</span>
          </button>
        </div>
      )}

      {/* Video Layer */}
      {mediaItem?.videoUrl ? (
          <video 
            ref={videoRef}
            src={mediaItem.videoUrl}
            className="w-full h-full object-cover z-10"
            loop
            controls
            autoPlay
            muted={false}
          />
      ) : (
          /* Image Layer */
          mediaItem?.url && (
            <img 
              src={mediaItem.url} 
              alt="Current Scene" 
              className={`w-full h-full object-cover transition-all duration-700 ${loading ? 'scale-105 blur-sm' : 'scale-100 blur-0'}`}
            />
          )
      )}
      
      {/* Overlay UI (Controls) */}
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4">
         
         {/* Top Bar: Navigation */}
         <div className="flex justify-between items-start pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {gallerySize > 1 && (
                <div className="flex items-center bg-slate-900/80 backdrop-blur rounded-full border border-slate-700 p-1 gap-2 shadow-lg">
                    <button 
                        onClick={onPrev}
                        disabled={currentIndex === 0}
                        className="p-1.5 hover:bg-slate-700 rounded-full text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-amber-500 px-1">
                        {currentIndex + 1} / {gallerySize}
                    </span>
                    <button 
                        onClick={onNext}
                        disabled={currentIndex === gallerySize - 1}
                        className="p-1.5 hover:bg-slate-700 rounded-full text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
            
            {/* New Paint Available Badge */}
            {canPaintNew && !loading && (
                 <button 
                    onClick={onPaintScene}
                    className="flex items-center gap-2 bg-amber-600/90 hover:bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-amber-900/50 backdrop-blur animate-pulse"
                >
                    <Paintbrush className="w-3 h-3" />
                    New Scene Available
                 </button>
            )}
         </div>

         {/* Bottom Bar: Action Buttons */}
         {mediaItem && !loading && !videoLoading && (
            <div className="flex justify-end gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                 
                 {/* Regenerate (Reroll) */}
                 {!mediaItem.videoUrl && (
                     <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRegenerate();
                        }}
                        className="bg-slate-900/80 hover:bg-slate-700 text-slate-200 p-2 rounded-full border border-slate-600 hover:border-slate-400 transition-all shadow-lg backdrop-blur-sm"
                        title="Redraw / Variant"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                 )}

                 {/* Animate */}
                 {!mediaItem.videoUrl && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onGenerateVideo();
                        }}
                        className="bg-slate-900/80 hover:bg-amber-600 text-white p-2 rounded-full border border-slate-600 hover:border-amber-400 transition-all shadow-lg backdrop-blur-sm"
                        title="Animate Scene (Veo)"
                    >
                        <Clapperboard className="w-5 h-5" />
                    </button>
                 )}
            </div>
         )}
      </div>

      {/* Scanline Effect Overlay (Only over image) */}
      {!mediaItem?.videoUrl && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] z-10 bg-[length:100%_4px] pointer-events-none opacity-30 mix-blend-overlay"></div>
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] z-10 pointer-events-none"></div>
          </>
      )}
    </div>
  );
};

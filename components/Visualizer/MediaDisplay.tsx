import React, { useRef, useEffect } from 'react';
import { MediaItem } from '@/types';

interface MediaDisplayProps {
  mediaItem: MediaItem;
  loading: boolean;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({ mediaItem, loading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (mediaItem?.videoUrl && videoRef.current) {
      videoRef.current.play();
    }
  }, [mediaItem]);

  if (mediaItem.videoUrl) {
    return (
      <video 
        ref={videoRef}
        src={mediaItem.videoUrl}
        className="w-full h-full object-cover z-10"
        loop
        controls
        autoPlay
        muted={false}
      />
    );
  }

  if (mediaItem.url) {
    return (
      <img 
        src={mediaItem.url} 
        alt="Current Scene" 
        className={`w-full h-full object-cover transition-all duration-700 ${loading ? 'scale-105 blur-sm' : 'scale-100 blur-0'}`}
      />
    );
  }

  return null;
};

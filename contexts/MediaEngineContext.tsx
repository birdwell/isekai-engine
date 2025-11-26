import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { generateSceneImage, generateSceneVideo } from '@/services/gemini';
import { MediaItem } from '@/types';

interface MediaEngineContextValue {
  gallery: MediaItem[];
  currentIndex: number;
  currentMedia: MediaItem | null;
  imageLoading: boolean;
  videoLoading: boolean;
  autoPaint: boolean;
  quality: 'fast' | 'quality';
  setAutoPaint: (value: boolean) => void;
  setQuality: (value: 'fast' | 'quality') => void;
  setScenePrompt: (prompt: string | undefined) => void;
  generateVideo: () => Promise<boolean>;
  generateImageForScene: () => void;
  regenerateCurrent: () => Promise<void>;
  nextImage: () => void;
  prevImage: () => void;
  canPaintNew: boolean;
}

const MediaEngineContext = createContext<MediaEngineContextValue | null>(null);

export const MediaEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [autoPaint, setAutoPaint] = useState<boolean>(false);
  const [quality, setQuality] = useState<'fast' | 'quality'>('fast');
  const [scenePrompt, setScenePrompt] = useState<string | undefined>(undefined);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [videoLoading, setVideoLoading] = useState<boolean>(false);

  useEffect(() => {
    const savedData = localStorage.getItem('isekai_save');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.gallery && Array.isArray(parsed.gallery)) {
          setGallery(parsed.gallery);
          setCurrentIndex(parsed.gallery.length - 1);
        } else if (parsed.sceneImage) {
          const legacyItem: MediaItem = {
            id: 'legacy-' + Date.now(),
            url: parsed.sceneImage,
            videoUrl: null,
            prompt: "Restored Image",
            timestamp: Date.now()
          };
          setGallery([legacyItem]);
        }
      } catch (e) {
        console.error("Failed to load gallery from localStorage", e);
      }
    }
  }, []);

  const addToGallery = useCallback((url: string, prompt: string) => {
    const newItem: MediaItem = {
      id: Date.now().toString(),
      url,
      videoUrl: null,
      prompt,
      timestamp: Date.now()
    };
    setGallery(prev => {
      const newGallery = [...prev, newItem];
      setCurrentIndex(newGallery.length - 1);
      return newGallery;
    });
  }, []);

  const generateImage = useCallback(async (prompt: string) => {
    setImageLoading(true);
    try {
      const b64Image = await generateSceneImage(prompt, quality);
      if (b64Image) {
        addToGallery(b64Image, prompt);
      }
    } catch (e) {
      console.error("Image gen failed", e);
    } finally {
      setImageLoading(false);
    }
  }, [quality, addToGallery]);

  const regenerateCurrent = useCallback(async () => {
    if (!scenePrompt) return;
    
    setImageLoading(true);
    try {
      const b64Image = await generateSceneImage(scenePrompt, quality);
      if (b64Image) {
        addToGallery(b64Image, scenePrompt);
      }
    } catch (e) {
      console.error("Regeneration failed", e);
    } finally {
      setImageLoading(false);
    }
  }, [scenePrompt, quality, addToGallery]);

  const generateVideo = useCallback(async () => {
    const currentItem = gallery[currentIndex];
    if (!currentItem || !currentItem.url) return false;
    
    setVideoLoading(true);
    try {
      const videoUrl = await generateSceneVideo(currentItem.prompt, currentItem.url);
      if (videoUrl) {
        setGallery(prev => {
          const newGallery = [...prev];
          if (newGallery[currentIndex]) {
            newGallery[currentIndex] = { ...newGallery[currentIndex], videoUrl };
          }
          return newGallery;
        });
        return true;
      }
    } catch (e) {
      console.error("Video gen failed", e);
    } finally {
      setVideoLoading(false);
    }
    return false;
  }, [gallery, currentIndex]);

  const nextImage = useCallback(() => setCurrentIndex(prev => Math.min(prev + 1, gallery.length - 1)), [gallery.length]);
  const prevImage = useCallback(() => setCurrentIndex(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    if (autoPaint && scenePrompt) {
      const lastItem = gallery[gallery.length - 1];
      if (!lastItem || lastItem.prompt !== scenePrompt) {
        generateImage(scenePrompt);
      }
    }
  }, [scenePrompt, autoPaint, gallery, generateImage]);

  const generateImageForScene = useCallback(() => {
    if (scenePrompt && scenePrompt.length > 0) {
      generateImage(scenePrompt);
    }
  }, [scenePrompt, generateImage]);

  const canPaintNew = Boolean(
    scenePrompt && 
    scenePrompt.length > 0 && 
    (gallery.length === 0 || gallery[gallery.length - 1].prompt !== scenePrompt)
  );

  const value: MediaEngineContextValue = {
    gallery,
    currentIndex,
    currentMedia: gallery[currentIndex] || null,
    imageLoading,
    videoLoading,
    autoPaint,
    quality,
    setAutoPaint,
    setQuality,
    setScenePrompt,
    generateVideo,
    generateImageForScene,
    regenerateCurrent,
    nextImage,
    prevImage,
    canPaintNew,
  };

  return (
    <MediaEngineContext.Provider value={value}>
      {children}
    </MediaEngineContext.Provider>
  );
};

export const useMediaEngineContext = (): MediaEngineContextValue => {
  const context = useContext(MediaEngineContext);
  if (!context) {
    throw new Error('useMediaEngineContext must be used within a MediaEngineProvider');
  }
  return context;
};


import { useState, useCallback, useEffect } from 'react';
import { generateSceneImage, generateSceneVideo } from '@/services/gemini';
import { MediaItem } from '../types';

export const useMediaEngine = (
    scenePrompt: string | undefined, 
    quality: 'fast' | 'quality'
) => {
    // Gallery State
    const [gallery, setGallery] = useState<MediaItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [autoPaint, setAutoPaint] = useState<boolean>(false); // Default false as requested

    const [imageLoading, setImageLoading] = useState<boolean>(false);
    const [videoLoading, setVideoLoading] = useState<boolean>(false);

    // Load gallery from localstorage
    useEffect(() => {
        const savedData = localStorage.getItem('isekai_save');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.gallery && Array.isArray(parsed.gallery)) {
                    setGallery(parsed.gallery);
                    setCurrentIndex(parsed.gallery.length - 1);
                    // Also support legacy save format migration
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
            } catch(e) {}
        }
    }, []);

    // Helper to add item to gallery
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
            setCurrentIndex(newGallery.length - 1); // Auto jump to new image
            return newGallery;
        });
    }, []);

    // Generate Image Function
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

    // Regenerate (Redraw) current scene
    // This replaces the image at the CURRENT index, or adds new if at end
    const regenerateCurrent = useCallback(async () => {
        if (!scenePrompt) return;
        
        setImageLoading(true);
        try {
            const b64Image = await generateSceneImage(scenePrompt, quality);
            if (b64Image) {
                // If we are looking at the latest image, we can just append a new version
                // Or if we want to "fix" the current one.
                // For simplicity/safety, we always append new generations to history 
                // so user doesn't lose the old one if the new one is worse.
                addToGallery(b64Image, scenePrompt);
            }
        } catch (e) {
            console.error("Regeneration failed", e);
        } finally {
            setImageLoading(false);
        }
    }, [scenePrompt, quality, addToGallery]);

    // Generate Video Trigger
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

    // Navigation
    const nextImage = () => setCurrentIndex(prev => Math.min(prev + 1, gallery.length - 1));
    const prevImage = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

    // Auto-Paint Logic
    // Only triggers if enabled AND the scene prompt is different from the last generated image
    useEffect(() => {
        if (autoPaint && scenePrompt) {
            const lastItem = gallery[gallery.length - 1];
            // Simple check: if prompt length is different or it's a new turn
            // We use a simple check to avoid infinite loops. 
            // In a real app, we'd track "lastProcessedPrompt" ID.
            if (!lastItem || lastItem.prompt !== scenePrompt) {
                generateImage(scenePrompt);
            }
        }
    }, [scenePrompt, autoPaint, gallery, generateImage]);

    return {
        gallery,
        currentIndex,
        currentMedia: gallery[currentIndex] || null,
        imageLoading,
        videoLoading,
        autoPaint,
        setAutoPaint,
        generateVideo,
        generateImageForScene: () => { if (scenePrompt && scenePrompt.length > 0) generateImage(scenePrompt); },
        regenerateCurrent,
        nextImage,
        prevImage,
        canPaintNew: scenePrompt && scenePrompt.length > 0 && (gallery.length === 0 || gallery[gallery.length-1].prompt !== scenePrompt)
    };
};

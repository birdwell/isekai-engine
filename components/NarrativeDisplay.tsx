
import React, { useEffect, useRef, useState } from 'react';
import { GameResponse } from '../types';
import { Volume2, Loader, Square } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { decodeBase64, decodeAudioData } from '../utils/audio';

interface NarrativeDisplayProps {
  response: GameResponse | null;
  isLoading: boolean;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({ response, isLoading }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [response, isLoading]);

  // Stop audio if text changes
  useEffect(() => {
    stopAudio();
  }, [response]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
    setIsAudioLoading(false);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!response?.narrative) return;

    setIsAudioLoading(true);

    try {
      // Strip markdown for cleaner speech
      const cleanText = response.narrative.replace(/\*\*|__|\*|_/g, '');
      
      const audioData = await generateSpeech(cleanText);
      
      if (!audioData) {
        throw new Error("No audio data received");
      }

      // Initialize Audio Context
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;

      const pcmData = decodeBase64(audioData);
      const audioBuffer = await decodeAudioData(pcmData, audioCtx, 24000, 1);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
      };

      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
      
    } catch (err) {
      console.error("Failed to play audio:", err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  // Simple Markdown parser function
  const renderMarkdown = (text: string) => {
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

  if (!response && isLoading) {
    return (
       <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-amber-500 animate-pulse font-serif text-xl">Summoning world data...</div>
       </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center text-slate-500 italic">
        The void awaits your presence...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header with Audio Controls */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
           <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Adventure Log</span>
           
           <button 
             onClick={handlePlayAudio}
             disabled={isAudioLoading}
             className={`
               flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all
               ${isPlaying 
                 ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800' 
                 : 'bg-amber-900/20 text-amber-500 hover:bg-amber-900/40 border border-amber-800/50'
               }
               ${isAudioLoading ? 'opacity-75 cursor-wait' : ''}
             `}
           >
             {isAudioLoading ? (
               <Loader className="w-3 h-3 animate-spin" />
             ) : isPlaying ? (
               <Square className="w-3 h-3 fill-current" />
             ) : (
               <Volume2 className="w-3 h-3" />
             )}
             <span>{isAudioLoading ? 'INITIALIZING...' : isPlaying ? 'STOP NARRATION' : 'READ ALOUD'}</span>
           </button>
        </div>

        {/* Story Text */}
        <div className="prose prose-invert prose-lg max-w-none">
           {response.narrative.split('\n').map((paragraph, idx) => {
             const trimmed = paragraph.trim();
             if (!trimmed) return null;
             return (
               <p key={idx} className="leading-relaxed text-slate-200">
                 {renderMarkdown(trimmed)}
               </p>
             );
           })}
        </div>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 mt-4 animate-pulse">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="w-2 h-2 bg-amber-500 rounded-full delay-75"></span>
            <span className="w-2 h-2 bg-amber-500 rounded-full delay-150"></span>
          </div>
        )}
        
        <div ref={endRef} />
      </div>
    </div>
  );
};

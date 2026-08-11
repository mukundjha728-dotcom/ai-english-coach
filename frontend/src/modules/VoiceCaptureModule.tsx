import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceCaptureModuleProps {
  onAudioData: (text: string) => void;
  isAiSpeaking: boolean;
}

export default function VoiceCaptureModule({ onAudioData, isAiSpeaking }: VoiceCaptureModuleProps) {
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-send when speech recognition stops (e.g. user pauses)
  const lastSentRef = useRef<string>('');

  useEffect(() => {
    const currentTranscript = transcript.trim();
    if (!isListening && currentTranscript && !isProcessing && !isAiSpeaking && currentTranscript !== lastSentRef.current) {
      setIsProcessing(true);
      lastSentRef.current = currentTranscript;
      onAudioData(transcript);
      
      // Fallback: If AI doesn't speak within 15 seconds, reset processing state
      const fallbackTimer = setTimeout(() => {
        setIsProcessing(false);
      }, 15000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [isListening, transcript, isProcessing, isAiSpeaking, onAudioData]);

  // Clear processing state once AI starts speaking
  useEffect(() => {
    if (isAiSpeaking) {
      setIsProcessing(false);
    }
  }, [isAiSpeaking]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      lastSentRef.current = '';
      startListening();
      setIsProcessing(false);
    }
  };

  // State calculations
  const state = isAiSpeaking ? 'ai-speaking' : isProcessing ? 'processing' : isListening ? 'listening' : 'idle';

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center py-8 relative">
      {/* Dynamic Background Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {state === 'listening' && (
          <>
            <div className="absolute w-32 h-32 bg-rose-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute w-40 h-40 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
          </>
        )}
        {state === 'ai-speaking' && (
          <>
            <div className="absolute w-32 h-32 bg-brand-500/20 rounded-full animate-pulse"></div>
            <div className="absolute w-48 h-48 bg-brand-500/10 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute w-64 h-64 bg-brand-500/5 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </>
        )}
      </div>

      {/* Main Button */}
      <button
        onClick={handleToggle}
        disabled={isAiSpeaking || isProcessing}
        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
          state === 'listening'
            ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
            : state === 'ai-speaking'
            ? 'bg-brand-600 shadow-brand-500/50 scale-105'
            : state === 'processing'
            ? 'bg-slate-700 cursor-wait'
            : 'bg-white dark:bg-slate-800 hover:scale-105 border-4 border-brand-500'
        }`}
      >
        {state === 'listening' ? (
          <Square fill="currentColor" size={32} className="text-white" />
        ) : state === 'ai-speaking' ? (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-6 bg-white rounded-full animate-bounce"></div>
            <div className="w-1.5 h-10 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        ) : state === 'processing' ? (
          <Loader2 size={32} className="text-white animate-spin" />
        ) : (
          <Mic size={40} className="text-brand-500" />
        )}
      </button>

      {/* Status Text & Live Transcript */}
      <div className="mt-8 text-center h-20 flex flex-col items-center max-w-md">
        <div className="text-sm font-semibold tracking-widest uppercase mb-2" style={{
          color: state === 'listening' ? '#f43f5e' : state === 'ai-speaking' ? '#8b5cf6' : 'currentColor'
        }}>
          {state === 'listening' ? 'Listening...' :
           state === 'ai-speaking' ? 'Coach is speaking' :
           state === 'processing' ? 'Processing...' :
           'Tap to speak'}
        </div>
        
        {state === 'listening' && (
          <div className="text-lg text-slate-800 dark:text-slate-200 line-clamp-2 italic opacity-80">
            "{transcript || '...'}"
          </div>
        )}
      </div>
    </div>
  );
}

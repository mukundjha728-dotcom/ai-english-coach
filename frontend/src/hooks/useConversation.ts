import { useState, useEffect, useRef } from 'react';
import { createConversationSocket } from '../lib/ws';
import { useSpeechSynthesis } from './useSpeechSynthesis';

export type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseConversationOptions {
  onLevelUpdated?: (newLevel: string) => void;
}

export function useConversation(sessionId: string, options?: UseConversationOptions) {
  const [state, setState] = useState<ConversationState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { speak, cancel, isSpeaking } = useSpeechSynthesis();
  
  const wsRef = useRef<ReturnType<typeof createConversationSocket> | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = createConversationSocket(
      sessionId,
      (data) => {
        if (data.type === 'ai_response' && data.text) {
          const text = data.text;
          setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: text }]);
          setState('speaking');
          speak(text, () => {
            // Once AI finishes speaking, go back to idle (or auto-listen depending on UX)
            setState('idle');
          });
        } else if (data.type === 'error') {
          setError(data.text || 'An error occurred');
          setState('idle');
        } else if (data.type === 'level_updated' && data.text) {
          if (options?.onLevelUpdated) {
            options.onLevelUpdated(data.text);
          }
        } else if (data.type === 'connected') {
          console.log('Conversation session ready');
        }
      },
      (err) => {
        setError(err);
        setState('idle');
      }
    );

    wsRef.current = ws;
    ws.connect();

    return () => {
      ws.disconnect();
      cancel();
    };
  }, [sessionId, speak, cancel]);

  const sendUserMessage = (text: string) => {
    if (!text.trim() || !wsRef.current) return;
    
    // Add to local UI
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: text }]);
    setState('processing');
    
    // Send to backend
    wsRef.current.send(text);
  };

  const endSession = () => {
    wsRef.current?.disconnect();
    cancel();
  };

  return {
    state,
    setState,
    messages,
    error,
    sendUserMessage,
    endSession,
    isSpeaking
  };
}

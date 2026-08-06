import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VoiceCaptureModule from '../modules/VoiceCaptureModule';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, CheckCircle2, Mic } from 'lucide-react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ConversationPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { speak, isSpeaking, cancel } = useSpeechSynthesis();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [levelUpToast, setLevelUpToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!sessionId || !session?.access_token) return;

    // Connect to WebSocket using the environment variable or fallback to localhost
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const websocket = new WebSocket(`${WS_URL}/ws/conversation?sessionId=${sessionId}&token=${session.access_token}`);

    websocket.onopen = () => {
      console.log('Connected to conversation WS');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'response') {
        setMessages((prev) => [
          ...prev, 
          { id: Date.now().toString(), role: 'assistant', content: data.text }
        ]);
        speak(data.text);
      } else if (data.type === 'level_updated') {
        setLevelUpToast(data.level);
        setTimeout(() => setLevelUpToast(null), 5000);
      } else if (data.type === 'error') {
        console.error('WS Error:', data.error);
        alert(`Error: ${data.error}`);
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
      cancel();
    };
  }, [sessionId, session]);

  const handleUserText = (text: string) => {
    if (!text.trim()) return;
    
    // Add to UI immediately
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text }]);
    
    // Send via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'audio_text', text }));
    }
  };

  const handleEndSession = async () => {
    if (ws) ws.close();
    cancel();
    navigate(`/scorecard/${sessionId}`);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      {/* Toast Notification */}
      {levelUpToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Level Up! You are now {levelUpToast}!
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex-none px-6 py-4 flex items-center justify-between glass-panel rounded-b-3xl z-10 sticky top-0 mx-4 mt-2">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline font-medium">Dashboard</span>
        </button>
        <div className="text-center font-heading font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600">
          Practice Session
        </div>
        <button 
          onClick={handleEndSession}
          className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl font-bold hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors"
        >
          End Session
        </button>
      </header>

      {/* Transcript Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6 flex flex-col justify-end min-h-full pb-32">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 py-12">
              <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mic size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Ready when you are</h3>
              <p>Tap the microphone below and start speaking.</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}
            >
              <div 
                className={`max-w-[80%] p-4 rounded-2xl text-lg shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Floating Voice Module */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/80 dark:via-slate-950/80 to-transparent pb-8">
        <div className="max-w-md mx-auto relative">
          <VoiceCaptureModule 
            onAudioData={handleUserText} 
            isAiSpeaking={isSpeaking}
          />
        </div>
      </div>
    </div>
  );
}

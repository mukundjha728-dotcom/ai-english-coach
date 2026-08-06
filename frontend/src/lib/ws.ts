import { supabase } from './supabaseClient';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

type MessageHandler = (data: { type: string; text?: string; sessionId?: string }) => void;

/**
 * WebSocket client helper for real-time voice conversation.
 * Handles connection, messaging, and reconnection.
 */
export function createConversationSocket(
  sessionId: string,
  onMessage: MessageHandler,
  onError?: (error: string) => void,
  onClose?: () => void
) {
  let ws: WebSocket | null = null;
  let isIntentionallyClosed = false;

  async function connect(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      onError?.('Not authenticated');
      return;
    }

    const url = `${WS_BASE}/ws/conversation?sessionId=${sessionId}&token=${session.access_token}`;
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[WS] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };

    ws.onerror = () => {
      onError?.('WebSocket connection error');
    };

    ws.onclose = () => {
      if (!isIntentionallyClosed) {
        onClose?.();
      }
    };
  }

  function send(text: string): void {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'user_message', text }));
    } else {
      onError?.('WebSocket not connected');
    }
  }

  function disconnect(): void {
    isIntentionallyClosed = true;
    ws?.close();
    ws = null;
  }

  return { connect, send, disconnect };
}

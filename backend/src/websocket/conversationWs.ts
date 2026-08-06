import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { createClient } from '@supabase/supabase-js';
import { handleConversationTurn } from '../services/conversationOrchestrator.js';
import { getSession } from '../db/queries/sessions.js';
import { logger } from '../utils/logger.js';

interface ConversationMessage {
  type: 'user_message';
  text: string;
}

interface ServerMessage {
  type: 'ai_response' | 'error' | 'connected';
  text?: string;
  sessionId?: string;
}

/**
 * Sets up WebSocket server for real-time voice conversation.
 * Per Architecture doc Section 3.2: WebSocket handlers are kept thin —
 * all logic is delegated to the Conversation Orchestrator.
 */
export function setupWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws/conversation' });

  wss.on('connection', async (ws: WebSocket, req) => {
    try {
      // Extract session ID and auth token from query params
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const sessionId = url.searchParams.get('sessionId');
      const token = url.searchParams.get('token');

      if (!sessionId || !token) {
        sendMessage(ws, { type: 'error', text: 'Missing sessionId or token' });
        ws.close(1008, 'Missing sessionId or token');
        return;
      }

      // Validate the auth token
      const authId = await validateToken(token);
      if (!authId) {
        sendMessage(ws, { type: 'error', text: 'Invalid authentication token' });
        ws.close(1008, 'Invalid token');
        return;
      }

      // Verify session exists
      const session = await getSession(sessionId);
      if (!session) {
        sendMessage(ws, { type: 'error', text: 'Session not found' });
        ws.close(1008, 'Session not found');
        return;
      }

      logger.info('WebSocket connected', { sessionId });
      sendMessage(ws, { type: 'connected', sessionId });

      // Handle incoming messages
      ws.on('message', async (rawData) => {
        try {
          const data: ConversationMessage = JSON.parse(rawData.toString());

          if (data.type !== 'user_message' || !data.text?.trim()) {
            sendMessage(ws, { type: 'error', text: 'Invalid message format' });
            return;
          }

          // Delegate to the orchestrator (thin handler pattern)
          const aiResponse = await handleConversationTurn(
            sessionId,
            data.text.trim(),
            authId,
            {
              onLevelUpdated: (newLevel) => {
                sendMessage(ws, { type: 'level_updated', text: newLevel } as any);
              }
            }
          );

          sendMessage(ws, { type: 'ai_response', text: aiResponse });
        } catch (error) {
          logger.error('WebSocket message handling error', {
            sessionId,
            error: String(error),
          });
          sendMessage(ws, {
            type: 'error',
            text: 'Failed to process your message. Please try again.',
          });
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket disconnected', { sessionId });
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', { sessionId, error: String(error) });
      });
    } catch (error) {
      logger.error('WebSocket connection setup error', { error: String(error) });
      ws.close(1011, 'Internal server error');
    }
  });

  logger.info('WebSocket server initialized at /ws/conversation');
}

/**
 * Validates a Supabase auth token and returns the user's auth ID.
 */
async function validateToken(token: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('Missing Supabase configuration for WebSocket auth');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch {
    return null;
  }
}

function sendMessage(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

import { supabase } from '../supabaseClient.js';
import { logger } from '../../utils/logger.js';

const MAX_MEMORY_TURNS = 10;

export interface MessageRecord {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * Persists a conversation turn to the messages table.
 */
export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<MessageRecord> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ session_id: sessionId, role, content })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    return data as MessageRecord;
  } catch (error) {
    logger.error('Error in addMessage', { sessionId, role, error: String(error) });
    throw error;
  }
}

/**
 * Fetches recent messages for a session (for conversation memory).
 * Returns messages in chronological order (oldest first).
 */
export async function getSessionMessages(
  sessionId: string,
  limit: number = MAX_MEMORY_TURNS
): Promise<MessageRecord[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Reverse to get chronological order (oldest first)
    return (data as MessageRecord[]).reverse();
  } catch (error) {
    logger.error('Error in getSessionMessages', { sessionId, error: String(error) });
    throw error;
  }
}

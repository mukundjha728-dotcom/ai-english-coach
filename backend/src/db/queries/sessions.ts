import { supabase } from '../supabaseClient.js';
import { logger } from '../../utils/logger.js';

export interface SessionRecord {
  id: string;
  user_id: string;
  document_id?: string | null;
  roleplay_id?: string | null;
  resume_id?: string | null;
  jd_id?: string | null;
  challenge_prompt?: string | null;
  session_type: string;
  summary: string | null;
  started_at: string;
  ended_at: string | null;
}

/**
 * Creates a new active session for the user.
 */
export async function createSession(userId: string, sessionType: string = 'conversation', documentId?: string, roleplayId?: string, resumeId?: string, jdId?: string, challengePrompt?: string): Promise<SessionRecord> {
  try {
    const payload: any = { user_id: userId, session_type: sessionType };
    if (documentId) {
      payload.document_id = documentId;
    }
    if (roleplayId) {
      payload.roleplay_id = roleplayId;
    }
    if (resumeId) {
      payload.resume_id = resumeId;
    }
    if (jdId) {
      payload.jd_id = jdId;
    }
    if (challengePrompt) {
      payload.challenge_prompt = challengePrompt;
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data as SessionRecord;
  } catch (error) {
    logger.error('Error in createSession', { userId, sessionType, error: String(error) });
    throw error;
  }
}

/**
 * Fetches a session by ID.
 */
export async function getSession(sessionId: string): Promise<SessionRecord | null> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      logger.warn('Session not found', { sessionId });
      return null;
    }

    return data as SessionRecord;
  } catch (error) {
    logger.error('Error in getSession', { sessionId, error: String(error) });
    throw error;
  }
}

/**
 * Marks a session as ended.
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to end session: ${error.message}`);
    }
  } catch (error) {
    logger.error('Error in endSession', { sessionId, error: String(error) });
    throw error;
  }
}

/**
 * Updates a session's summary (used for long-term memory).
 */
export async function updateSessionSummary(sessionId: string, summary: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ summary })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update session summary: ${error.message}`);
    }
  } catch (error) {
    logger.error('Error in updateSessionSummary', { sessionId, error: String(error) });
    throw error;
  }
}

/**
 * Gets basic stats for a user (total sessions).
 */
export async function getUserStats(userId: string): Promise<{ totalSessions: number }> {
  try {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }

    return { totalSessions: count || 0 };
  } catch (error) {
    logger.error('Error in getUserStats', { userId, error: String(error) });
    throw error;
  }
}

/**
 * Fetches summaries of previous sessions for a user to provide long-term memory to the LLM.
 */
export async function getPreviousSessionSummaries(userId: string, currentSessionId: string, limit: number = 3): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('summary')
      .eq('user_id', userId)
      .neq('id', currentSessionId)
      .not('summary', 'is', null)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn('Failed to fetch previous session summaries', { error: error.message });
      return [];
    }

    return data.map(d => d.summary).filter(Boolean) as string[];
  } catch (error) {
    logger.error('Error in getPreviousSessionSummaries', { userId, error: String(error) });
    return [];
  }
}

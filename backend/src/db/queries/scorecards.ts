import { supabase } from '../supabaseClient.js';
import { logger } from '../../utils/logger.js';

export interface ScorecardRecord {
  id?: string;
  session_id: string;
  user_id: string;
  grammar_score: number;
  vocabulary_score: number;
  fluency_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  created_at?: string;
}

/**
 * Inserts a new scorecard into the database.
 */
export async function insertScorecard(scorecard: ScorecardRecord): Promise<ScorecardRecord> {
  try {
    const { data, error } = await supabase
      .from('scorecards')
      .insert([scorecard])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert scorecard: ${error.message}`);
    }

    return data as ScorecardRecord;
  } catch (error) {
    logger.error('Error in insertScorecard', { sessionId: scorecard.session_id, error: String(error) });
    throw error;
  }
}

/**
 * Retrieves a scorecard by session ID.
 */
export async function getScorecardBySessionId(sessionId: string): Promise<ScorecardRecord | null> {
  try {
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch scorecard: ${error.message}`);
    }

    return data as ScorecardRecord | null;
  } catch (error) {
    logger.error('Error in getScorecardBySessionId', { sessionId, error: String(error) });
    throw error;
  }
}

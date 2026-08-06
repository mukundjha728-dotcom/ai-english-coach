import { llmClient } from '../llm/LLMClient.js';
import { buildScorecardPrompt } from '../llm/prompts/conversation.js';
import { getSessionMessages } from '../db/queries/messages.js';
import { getSession } from '../db/queries/sessions.js';
import { insertScorecard, getScorecardBySessionId, ScorecardRecord } from '../db/queries/scorecards.js';
import { logger } from '../utils/logger.js';

/**
 * Generates a scorecard for a completed session.
 */
export async function generateSessionScorecard(sessionId: string, authId: string): Promise<ScorecardRecord> {
  try {
    // Verify session
    const session = await getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if one already exists
    const existing = await getScorecardBySessionId(sessionId);
    if (existing) {
      return existing;
    }

    // Get all messages
    const messages = await getSessionMessages(sessionId, 100);
    if (messages.length < 2) {
      // Return a default scorecard if not enough data
      const defaultScorecard = {
        session_id: sessionId,
        user_id: session.user_id,
        grammar_score: 0,
        vocabulary_score: 0,
        fluency_score: 0,
        strengths: ['Started the session'],
        areas_for_improvement: ['Try speaking more next time']
      };
      return await insertScorecard(defaultScorecard);
    }

    const history = messages.map(msg => ({ role: msg.role, content: msg.content }));
    const prompt = buildScorecardPrompt(history);

    // Call LLM using JSON mode if available, or just regular generation and parsing
    const response = await llmClient.generate({
      prompt,
      mode: 'conversation' 
    });

    // Parse the JSON. Clean up backticks if LLM outputs markdown json block
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
    }
    if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.substring(0, jsonText.length - 3);
    }

    const parsedData = JSON.parse(jsonText.trim());

    const scorecard: ScorecardRecord = {
      session_id: sessionId,
      user_id: session.user_id,
      grammar_score: parsedData.grammar_score || 0,
      vocabulary_score: parsedData.vocabulary_score || 0,
      fluency_score: parsedData.fluency_score || 0,
      strengths: parsedData.strengths || [],
      areas_for_improvement: parsedData.areas_for_improvement || []
    };

    const saved = await insertScorecard(scorecard);
    logger.info('Generated scorecard', { sessionId, provider: response.provider });
    return saved;

  } catch (error) {
    logger.error('Error generating scorecard', { sessionId, error: String(error) });
    throw error;
  }
}

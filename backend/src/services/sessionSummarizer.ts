import { llmClient } from '../llm/LLMClient.js';
import { buildSummarizationPrompt } from '../llm/prompts/conversation.js';
import { getSessionMessages } from '../db/queries/messages.js';
import { updateSessionSummary, getSession } from '../db/queries/sessions.js';
import { logger } from '../utils/logger.js';

/**
 * Summarizes the session to keep long-term memory within context limits.
 */
export async function summarizeSession(sessionId: string): Promise<string | null> {
  try {
    const session = await getSession(sessionId);
    if (!session) return null;

    // Fetch all messages so far (or a large chunk)
    // We might want to pass in the limit based on tokens, but for now we fetch say last 20
    const messages = await getSessionMessages(sessionId, 20);
    
    if (messages.length === 0) return null;
    
    const history = messages.map(msg => ({ role: msg.role, content: msg.content }));
    
    // Include existing summary if any, to create a rolling summary
    if (session.summary) {
        history.unshift({ role: 'assistant', content: `[Previous Summary: ${session.summary}]` });
    }

    const prompt = buildSummarizationPrompt(history);
    
    const response = await llmClient.generate({
      prompt,
      mode: 'conversation' 
    });

    const summary = response.text.trim();
    
    await updateSessionSummary(sessionId, summary);
    logger.info('Session summarized', { sessionId });
    
    return summary;
  } catch (error) {
    logger.error('Error in session summarization', { sessionId, error: String(error) });
    return null;
  }
}

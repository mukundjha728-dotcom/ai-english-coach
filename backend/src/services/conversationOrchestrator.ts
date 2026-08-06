import { llmClient } from '../llm/LLMClient.js';
import { buildConversationSystemPrompt, buildConversationPrompt } from '../llm/prompts/conversation.js';
import { addMessage, getSessionMessages } from '../db/queries/messages.js';
import { findOrCreateUser } from '../db/queries/users.js';
import { getSession } from '../db/queries/sessions.js';
import { findSimilarChunks } from '../db/queries/documents.js';
import { detectAndUpdateProficiency } from './proficiencyDetector.js';
import { summarizeSession } from './sessionSummarizer.js';
import { logger } from '../utils/logger.js';

/**
 * Conversation Orchestrator — the core "brain" of the system.
 * Per Architecture doc Section 3.3:
 * 1. Receives transcribed user speech (text) from the client
 * 2. Fetches conversation memory (recent turns)
 * 3. Constructs the LLM prompt
 * 4. Sends request to the LLM Provider (via LLMClient)
 * 5. Persists both user and assistant messages to DB
 * 6. Returns the AI response text
 *
 * This is stateless — session state is persisted in the database,
 * not in server memory (important for free-tier hosting that may restart).
 */
export async function handleConversationTurn(
  sessionId: string,
  userText: string,
  authId: string,
  options?: {
    onLevelUpdated?: (level: string) => void;
  }
): Promise<string> {
  try {
    // 1. Get user profile and session
    const user = await findOrCreateUser(authId);
    const proficiencyLevel = user.proficiency_level || 'beginner';
    const session = await getSession(sessionId);

    // 2. Persist the user's message
    await addMessage(sessionId, 'user', userText);

    // 3. Fetch recent conversation history for memory
    const recentMessages = await getSessionMessages(sessionId);

    // Build conversation history (exclude the message we just added — it's the current turn)
    const history = recentMessages
      .slice(0, -1)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    // Inject session summary if it exists (long-term memory)
    if (session?.summary) {
      history.unshift({ role: 'assistant', content: `[Previous Context: ${session.summary}]` });
    }

    // 4. RAG: Inject document context if session has a document
    let ragContext = '';
    if (session?.document_id) {
      try {
        const queryEmbedding = await llmClient.generateEmbedding(userText);
        const similarChunks = await findSimilarChunks(session.document_id, queryEmbedding, 3);
        if (similarChunks.length > 0) {
          ragContext = '\n[Document Context for reference:]\n' + similarChunks.map(c => c.content).join('\n\n');
        }
      } catch (err) {
        logger.error('Failed to fetch document context', { error: String(err) });
      }
    }

    // 5. Build the full prompt
    const systemPrompt = buildConversationSystemPrompt(proficiencyLevel);
    const fullPrompt = buildConversationPrompt(systemPrompt + ragContext, history, userText);

    // 6. Call LLM via the abstracted client
    const response = await llmClient.generate({
      prompt: fullPrompt,
      mode: 'conversation',
    });

    // 7. Persist the assistant's response
    await addMessage(sessionId, 'assistant', response.text);

    logger.info('Conversation turn completed', {
      sessionId,
      provider: response.provider,
    });

    // 8. Background Tasks (Phase 2: Levels & Memory)
    // Run level detection after roughly 3 user turns if they are a beginner/elementary
    if (recentMessages.length >= 6 && recentMessages.length % 6 === 0) {
      if (proficiencyLevel.toLowerCase() === 'beginner' || proficiencyLevel.toLowerCase() === 'elementary') {
        detectAndUpdateProficiency(sessionId, user.id, authId).then(newLevel => {
          if (newLevel && options?.onLevelUpdated) {
            options.onLevelUpdated(newLevel);
          }
        }).catch(e => logger.error('Async level detection failed', { error: String(e) }));
      }
    }

    // Run summarization every ~10 turns (20 messages) for long-term memory
    if (recentMessages.length >= 20 && recentMessages.length % 10 === 0) {
      summarizeSession(sessionId).catch(e => logger.error('Async summarization failed', { error: String(e) }));
    }

    return response.text;
  } catch (error) {
    logger.error('Conversation orchestrator error', {
      sessionId,
      error: String(error),
    });
    throw error;
  }
}

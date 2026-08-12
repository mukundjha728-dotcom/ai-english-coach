import { llmClient } from '../llm/LLMClient.js';
import { buildConversationSystemPrompt, buildConversationPrompt } from '../llm/prompts/conversation.js';
import { addMessage, getSessionMessages } from '../db/queries/messages.js';
import { findOrCreateUser } from '../db/queries/users.js';
import { getSession, getPreviousSessionSummaries } from '../db/queries/sessions.js';
import { getRoleplayById } from '../db/queries/roleplays.js';
import { findSimilarChunks, getDocumentText } from '../db/queries/documents.js';
import { detectAndUpdateProficiency } from './proficiencyDetector.js';
import { summarizeSession } from './sessionSummarizer.js';
import { detectRepetitiveWords } from './vocabularyTracker.js';
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
    onVocabularySuggestion?: (suggestion: any) => void;
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
    let systemPrompt = buildConversationSystemPrompt(proficiencyLevel);
    
    // Inject long-term memory (past session summaries)
    if (session?.session_type === 'conversation' && recentMessages.length <= 6) {
      const pastSummaries = await getPreviousSessionSummaries(user.id, sessionId);
      if (pastSummaries.length > 0) {
        systemPrompt += `\n\n[Long-term Memory - Previous Sessions]:\n${pastSummaries.map((s, i) => `Past Session ${i + 1}: ${s}`).join('\n')}\n\nYou must remember these past interactions. Acknowledge their return gracefully and continue the coaching where you left off if applicable, or ask how they have been since last time. Do not explicitly say "I see in my memory", act natural.`;
      }
    }
    
    // Override with roleplay system prompt if session has a roleplay_id
    if (session?.roleplay_id) {
      const roleplay = await getRoleplayById(session.roleplay_id);
      if (roleplay) {
        systemPrompt = `${roleplay.system_prompt_template}\n\nThe user's current English proficiency level is: ${proficiencyLevel}. Keep your vocabulary appropriate for this level. Correct major mistakes kindly.`;
      }
    }

    // Override for Interview mode
    if (session?.session_type === 'interview') {
      let resumeContext = '';
      let jdContext = '';
      if (session.resume_id) {
        resumeContext = await getDocumentText(session.resume_id);
      }
      if (session.jd_id) {
        jdContext = await getDocumentText(session.jd_id);
      }
      
      systemPrompt = `You are an expert hiring manager conducting a mock interview with the user.
You will assess their technical skills based on the job description, their behavioral fit, and their English communication skills.
Be professional, ask probing questions, and evaluate their responses. Wait for their answers before asking the next question.
Do not provide answers for them. Correct major English mistakes subtly if they struggle.

[Job Description Context]:
${jdContext || 'No job description provided.'}

[Candidate Resume Context]:
${resumeContext || 'No resume provided.'}

The user's current English proficiency level is: ${proficiencyLevel}.`;
    }

    const fullPrompt = buildConversationPrompt(systemPrompt + ragContext, history, userText);
    
    // Inject challenge prompt if daily challenge
    if (session?.session_type === 'daily_challenge' && session.challenge_prompt) {
      systemPrompt += `\n\n[Daily Challenge Topic]: ${session.challenge_prompt}\nPlease initiate and evaluate the user based on this challenge.`;
    }

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

    // Vocabulary tracking every ~4 user turns (8 messages)
    if (recentMessages.length >= 8 && recentMessages.length % 8 === 0) {
      detectRepetitiveWords(recentMessages).then(suggestion => {
        if (suggestion && options?.onVocabularySuggestion) {
          options.onVocabularySuggestion(suggestion);
        }
      }).catch(e => logger.error('Async vocab tracking failed', { error: String(e) }));
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

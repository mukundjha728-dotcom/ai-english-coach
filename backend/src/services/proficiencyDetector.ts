import { llmClient } from '../llm/LLMClient.js';
import { buildLevelDetectionPrompt } from '../llm/prompts/conversation.js';
import { getSessionMessages } from '../db/queries/messages.js';
import { updateProficiencyLevel, getUserProfile } from '../db/queries/users.js';
import { logger } from '../utils/logger.js';

/**
 * Valid levels the system recognizes.
 */
const VALID_LEVELS = [
  'Beginner',
  'Elementary',
  'Intermediate',
  'Advanced',
  'Business English',
  'Interview English'
];

/**
 * Runs asynchronously to detect and update user's proficiency level.
 */
export async function detectAndUpdateProficiency(sessionId: string, userId: string, authId: string): Promise<string | null> {
  try {
    const user = await getUserProfile(userId);
    
    // We might only want to detect if they are beginner or haven't been assessed recently.
    // For now, we'll run it and see if it's different.
    
    // Fetch last N messages to assess
    const messages = await getSessionMessages(sessionId, 6); // e.g. 3 user turns, 3 coach turns
    
    // We only need user messages for assessment, but seeing context is helpful for the LLM
    const history = messages.map(msg => ({ role: msg.role, content: msg.content }));
    
    const prompt = buildLevelDetectionPrompt(history);
    
    const response = await llmClient.generate({
      prompt,
      mode: 'conversation' // Reuse conversation mode settings for speed/cost
    });

    // Clean up response text (in case LLM adds extra spaces/punctuation)
    let detectedLevel = response.text.trim();
    
    // Sometimes LLM might say "The level is Intermediate", extract just the level
    const matchedLevel = VALID_LEVELS.find(level => detectedLevel.toLowerCase().includes(level.toLowerCase()));
    
    if (matchedLevel && (!user || matchedLevel.toLowerCase() !== user.proficiency_level.toLowerCase())) {
      logger.info('Proficiency level updated', { userId, old: user?.proficiency_level, new: matchedLevel });
      await updateProficiencyLevel(userId, matchedLevel);
      return matchedLevel;
    }
    
    return null; // No change
  } catch (error) {
    logger.error('Error in proficiency detection', { sessionId, userId, error: String(error) });
    return null;
  }
}

import { llmClient } from '../llm/LLMClient.js';
import { logger } from '../utils/logger.js';

/**
 * Analyzes recent user messages for overused basic words and suggests richer alternatives.
 */
export async function detectRepetitiveWords(
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ overusedWord: string; suggestions: string[]; context: string } | null> {
  try {
    const userMessages = conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');

    if (!userMessages || userMessages.split(' ').length < 20) {
      return null;
    }

    const prompt = `You are a vocabulary coach. Analyze the following user text for overused, basic words (like "good", "bad", "nice", "very", "happy", "sad", "big", "small").
If you find a word that is overused or too basic for the context, suggest 2 richer alternatives.

User text:
"${userMessages}"

Output MUST be a valid JSON object matching exactly this schema, or null if no obvious repetition is found.
Schema:
{
  "overusedWord": "string (the basic word)",
  "suggestions": ["string", "string"],
  "context": "string (brief 1 sentence explanation of why the suggestions are better)"
}`;

    const response = await llmClient.generate({
      prompt,
      mode: 'conversation',
    });

    // Clean JSON markdown blocks
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7);
    if (jsonText.startsWith('```')) jsonText = jsonText.substring(3);
    if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3);
    jsonText = jsonText.trim();

    if (jsonText === 'null' || !jsonText) {
      return null;
    }

    const result = JSON.parse(jsonText);
    if (result.overusedWord && result.suggestions?.length > 0) {
      return result;
    }
    return null;
  } catch (error) {
    logger.error('Vocabulary tracking error', { error: String(error) });
    return null;
  }
}

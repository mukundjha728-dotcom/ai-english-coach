/**
 * System prompt templates for the AI English Coach.
 * Stored as versioned templates (per Rules.md Section 6).
 * Never inline prompts ad-hoc in service code.
 */

/**
 * Builds the system prompt for conversation mode.
 * Tone: warm, encouraging, coach-like (per Design doc Section 6).
 */
export function buildConversationSystemPrompt(proficiencyLevel: string): string {
  return `You are an AI English Communication Coach — warm, patient, and encouraging. Your role is to have natural, flowing conversations that help the user improve their spoken English.

## Your Behavior Rules:
1. **Be conversational** — respond naturally like a friendly human coach, not a textbook.
2. **Adapt to the user's level** — the user's current proficiency level is: ${proficiencyLevel}. Adjust your vocabulary and sentence complexity accordingly.
3. **Correct gently** — if the user makes a grammar or vocabulary mistake, briefly acknowledge the correct form and continue the conversation naturally. Do NOT stop the flow to give a lecture.
   - Example: If user says "I go market today", respond like: "Oh, you went to the market today! That's great. What did you buy?"
4. **Encourage speaking** — ask follow-up questions, show interest, keep the conversation going.
5. **Never be judgmental** — frame corrections as coaching, not grading.
6. **Keep responses concise** — since your responses will be spoken aloud via text-to-speech, keep them to 2-3 sentences. Avoid long paragraphs.
7. **Use varied topics** — cover daily life, opinions, experiences, and gently introduce new vocabulary.

## Proficiency Level Guidelines:
- **Beginner**: Use simple words, short sentences, basic topics (daily routine, family, food).
- **Elementary**: Slightly more complex sentences, introduce phrasal verbs, everyday situations.
- **Intermediate**: Natural conversation pace, introduce idioms, discuss opinions and experiences.
- **Advanced**: Challenge with nuanced topics, complex grammar, professional contexts.
- **Business English / Interview English**: Focus on professional communication, formal register.

Remember: Your goal is to make the user feel comfortable speaking English, not to intimidate them.`;
}

/**
 * Builds the full prompt including conversation history and the current user turn.
 */
export function buildConversationPrompt(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string
): string {
  let prompt = systemPrompt + '\n\n';

  if (conversationHistory.length > 0) {
    prompt += '## Conversation so far:\n';
    for (const msg of conversationHistory) {
      const label = msg.role === 'user' ? 'User' : 'Coach';
      prompt += `${label}: ${msg.content}\n`;
    }
    prompt += '\n';
  }

  prompt += `User: ${userMessage}\n\nCoach:`;

  return prompt;
}

/**
 * Builds the prompt for level detection based on recent turns.
 */
export function buildLevelDetectionPrompt(conversationHistory: Array<{ role: string; content: string }>): string {
  let prompt = `You are an expert English language evaluator. Analyze the user's spoken English in the following conversation excerpt and determine their proficiency level.
Pay attention to grammar, vocabulary breadth, and sentence structure.

Available levels:
- Beginner
- Elementary
- Intermediate
- Advanced
- Business English
- Interview English

Conversation Excerpt:\n`;

  for (const msg of conversationHistory) {
    const label = msg.role === 'user' ? 'User' : 'Coach';
    prompt += `${label}: ${msg.content}\n`;
  }

  prompt += `
Based on the User's responses, output ONLY their exact proficiency level from the available levels above. Do not include any other text.`;

  return prompt;
}

/**
 * Builds the prompt for session summarization.
 */
export function buildSummarizationPrompt(conversationHistory: Array<{ role: string; content: string }>): string {
  let prompt = `You are an AI assistant tasked with summarizing a conversation between an English learning user and their AI coach.
Create a brief, concise summary of what was discussed so far. Focus on the main topics and any specific corrections made.
This summary will be used as long-term memory for the coach to continue the conversation naturally.

Conversation History:\n`;

  for (const msg of conversationHistory) {
    const label = msg.role === 'user' ? 'User' : 'Coach';
    prompt += `${label}: ${msg.content}\n`;
  }

  prompt += `\nProvide a concise 2-3 sentence summary:`;

  return prompt;
}

/**
 * Builds the prompt for generating a structured scorecard at the end of a session.
 */
export function buildScorecardPrompt(conversationHistory: Array<{ role: string; content: string }>, sessionType: string = 'conversation'): string {
  let prompt = `You are an expert English language evaluator. Evaluate the user's performance in the following conversation.
Generate a structured JSON scorecard.

The JSON MUST exactly match this schema:
{
  "grammar_score": number (0-100),
  "vocabulary_score": number (0-100),
  "fluency_score": number (0-100),
  "strengths": string[] (2-3 items highlighting what they did well),
  "areas_for_improvement": string[] (2-3 items highlighting what they need to work on)
}
`;

  if (sessionType === 'interview') {
    prompt += `Since this was an interview simulation, please also evaluate their technical accuracy, confidence, and how well they answered the questions within the strengths and areas_for_improvement fields.\n\n`;
  }

  prompt += `Conversation Transcript:\n`;

  for (const msg of conversationHistory) {
    const label = msg.role === 'user' ? 'User' : 'Coach';
    prompt += `${label}: ${msg.content}\n`;
  }

  return prompt;
}

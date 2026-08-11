import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, LLMRequest, LLMResponse } from '../LLMClient.js';
import { RateLimitError } from '../LLMClient.js';
import { logger } from '../../utils/logger.js';

const MODEL_NAME = 'gemini-flash-latest';

/**
 * Gemini provider — implements LLMProvider using Google's Generative AI SDK.
 * Uses gemini-flash-latest for fast, free-tier conversation responses.
 */
export class GeminiProvider implements LLMProvider {
  public readonly name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: MODEL_NAME });

      const fullPrompt = request.context
        ? `${request.context}\n\n${request.prompt}`
        : request.prompt;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return {
        text,
        provider: this.name,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Detect rate limit errors (HTTP 429 or quota exceeded)
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('RATE_LIMIT') ||
        errorMessage.includes('Resource has been exhausted')
      ) {
        logger.warn('Gemini rate limit hit', { error: errorMessage });
        throw new RateLimitError(this.name);
      }

      logger.error('Gemini generation failed', { error: errorMessage, mode: request.mode });
      throw new Error(`Gemini generation failed: ${errorMessage}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-embedding-2' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('RATE_LIMIT')
      ) {
        logger.warn('Gemini embedding rate limit hit');
        throw new RateLimitError(this.name);
      }
      logger.error('Gemini embedding failed', { error: errorMessage });
      throw new Error(`Gemini embedding failed: ${errorMessage}`);
    }
  }
}

import { logger } from '../utils/logger.js';
import { GeminiProvider } from './providers/gemini.js';

/**
 * Supported LLM modes per Architecture doc Section 3.5.
 */
export type LLMMode = 'conversation' | 'interview' | 'grammar_review' | 'embedding';

export interface LLMRequest {
  prompt: string;
  context?: string;
  mode: LLMMode;
}

export interface LLMResponse {
  text: string;
  provider: string;
}

/**
 * Provider interface — all LLM providers must implement this.
 * This abstraction is critical for swapping/load-balancing free-tier
 * providers without touching business logic (per Rules.md Section 5).
 */
export interface LLMProvider {
  name: string;
  generate(request: LLMRequest): Promise<LLMResponse>;
  generateEmbedding(text: string): Promise<number[]>;
}

/**
 * Rate limit error — thrown when a provider hits its free-tier limit.
 * Used by the LLMClient to trigger fallback to the next provider.
 */
export class RateLimitError extends Error {
  constructor(provider: string) {
    super(`Rate limit exceeded for provider: ${provider}`);
    this.name = 'RateLimitError';
  }
}

/**
 * LLMClient — the single entry point for all LLM calls.
 * Never call a provider's SDK directly from a service — always go
 * through LLMClient.generate() (per Rules.md Section 5).
 *
 * Supports fallback: if the primary provider is rate-limited,
 * automatically tries the next configured provider.
 */
class LLMClient {
  private providers: LLMProvider[] = [];

  constructor() {
    // Initialize available providers based on configured API keys
    if (process.env.GEMINI_API_KEY) {
      this.providers.push(new GeminiProvider());
    }

    // Future: add Groq, OpenRouter providers here
    // if (process.env.GROQ_API_KEY) {
    //   this.providers.push(new GroqProvider());
    // }

    if (this.providers.length === 0) {
      logger.error('No LLM providers configured. Set at least GEMINI_API_KEY in .env');
    }
  }

  /**
   * Generates a response using the configured LLM provider(s).
   * Attempts each provider in order, falling back on rate limit errors.
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (this.providers.length === 0) {
      throw new Error('No LLM providers available. Check your API key configuration.');
    }

    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        const response = await provider.generate(request);
        return response;
      } catch (error) {
        if (error instanceof RateLimitError) {
          logger.warn(`Provider ${provider.name} rate-limited, trying next provider`);
          lastError = error;
          continue;
        }
        // Non-rate-limit errors are thrown immediately
        throw error;
      }
    }

    throw lastError || new Error('All LLM providers failed');
  }

  /**
   * Generates embeddings for a given text.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (this.providers.length === 0) {
      throw new Error('No LLM providers available.');
    }

    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        const response = await provider.generateEmbedding(text);
        return response;
      } catch (error) {
        if (error instanceof RateLimitError) {
          logger.warn(`Provider ${provider.name} rate-limited for embeddings, trying next`);
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error('All LLM providers failed for embeddings');
  }
}

// Export singleton instance
export const llmClient = new LLMClient();

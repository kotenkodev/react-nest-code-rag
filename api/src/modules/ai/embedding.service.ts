import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { appConfig, type AppConfig } from '../../config/app.config';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: OpenAI;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: AppConfig,
  ) {
    this.client = new OpenAI({
      baseURL: this.config.embeddingBaseUrl || 'https://api.jina.ai/v1',
      apiKey: this.config.embeddingApiKey,
    });
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    initialDelayMs = 2000,
  ): Promise<T> {
    let attempt = 0;
    let delay = initialDelayMs;

    while (true) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        const isRateLimit =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.toLowerCase().includes('rate limit');

        if (isRateLimit && attempt <= maxRetries) {
          this.logger.warn(
            `Jina API rate limit (429) hit on attempt ${attempt}/${maxRetries}. Retrying in ${delay / 1000}s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * 2, 30000);
        } else {
          throw err;
        }
      }
    }
  }

  async embedText(text: string): Promise<number[]> {
    if (!text || !text.trim()) return [];

    const safeText = text.slice(0, 8000);
    return this.withRetry(async () => {
      const response = await this.client.embeddings.create({
        model: this.config.embeddingModel,
        input: safeText,
        ...({ truncate: true } as Record<string, unknown>),
      });

      return response.data[0].embedding;
    });
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];

    const safeTexts = texts.map((t) => t.slice(0, 8000));
    return this.withRetry(async () => {
      const response = await this.client.embeddings.create({
        model: this.config.embeddingModel,
        input: safeTexts,
        ...({ truncate: true } as Record<string, unknown>),
      });

      return response.data.map((item) => item.embedding);
    });
  }
}

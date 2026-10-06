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

  async embedText(text: string): Promise<number[]> {
    if (!text || !text.trim()) return [];

    const response = await this.client.embeddings.create({
      model: this.config.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];

    const response = await this.client.embeddings.create({
      model: this.config.embeddingModel,
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  }
}

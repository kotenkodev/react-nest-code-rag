import { registerAs, ConfigType } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  cors: process.env.CORS_ORIGINS ?? '',

  embeddingBaseUrl: process.env.EMBEDDING_BASE_URL ?? 'https://api.jina.ai/v1',
  embeddingApiKey: process.env.EMBEDDING_API_KEY ?? '',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'jina-embeddings-v3',

  llmBaseUrl: process.env.LLM_BASE_URL ?? 'https://api.groq.com/openai/v1',
  llmApiKey: process.env.LLM_API_KEY ?? '',
  llmModel: process.env.LLM_MODEL ?? 'openai/gpt-oss-120b',
}));

export type AppConfig = ConfigType<typeof appConfig>;

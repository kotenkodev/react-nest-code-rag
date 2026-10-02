import { registerAs, ConfigType } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  cors: process.env.CORS_ORIGINS ?? '',

  llmApiKey: process.env.LLM_API_KEY ?? '',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
  llmModel: process.env.LLM_MODEL ?? 'gpt-4o-mini',
}));

export type AppConfig = ConfigType<typeof appConfig>;

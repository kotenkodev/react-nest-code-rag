import * as Joi from 'joi';
import { AppConfig } from './app.config';

export interface ConfigType {
  app: AppConfig;
}

export const appConfigSchema: Joi.ObjectSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),

  EMBEDDING_BASE_URL: Joi.string().optional().allow(null, ''),
  EMBEDDING_API_KEY: Joi.string().optional().allow(null, ''),
  EMBEDDING_MODEL: Joi.string().optional().allow(null, ''),

  LLM_BASE_URL: Joi.string().optional().allow(null, ''),
  LLM_API_KEY: Joi.string().optional().allow(null, ''),
  LLM_MODEL: Joi.string().optional().allow(null, ''),
});

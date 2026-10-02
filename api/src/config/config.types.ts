import * as Joi from 'joi';
import { AppConfig } from './app.config';

export interface ConfigType {
  app: AppConfig;
}

export const appConfigSchema: Joi.ObjectSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),

  LLM_API_KEY: Joi.string().allow(null).allow('').optional(),
  EMBEDDING_MODEL: Joi.string().optional().allow(null).allow(''),
  LLM_MODEL: Joi.string().optional().allow(null).allow(''),
});

import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { appConfig, type AppConfig } from '../../config/app.config';

export const CODE_ASSISTANT_SYSTEM_PROMPT = `
You are an expert AI Code Documentation Assistant.
Your goal is to explain codebases, trace functions, find API endpoints, and clarify architecture.
Rules:
1. Always base your answers on the provided CODE CONTEXT.
2. Cite the exact file paths and line numbers (e.g. \`src/lib/auth.ts:15-30\`).
3. If an endpoint or feature is not in the context, state that clearly instead of hallucinating.
4. Structure explanations with headings, bullet points, and code snippets where helpful.
`;

@Injectable()
export class LlmserviceService {
  private readonly logger = new Logger(LlmserviceService.name);
  private readonly client: OpenAI;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: AppConfig,
  ) {
    this.client = new OpenAI({
      baseURL: this.config.llmBaseUrl || 'https://api.groq.com/openai/v1',
      apiKey: this.config.llmApiKey,
    });
  }

  getSystemPrompt(): string {
    return CODE_ASSISTANT_SYSTEM_PROMPT;
  }

  async generateChatCompletion(
    userPrompt: string,
    context: string,
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.config.llmModel,
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        {
          role: 'user',
          content: `### CODE CONTEXT:\n${context}\n\n### USER QUESTION:\n${userPrompt}`,
        },
      ],
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content || '';
  }

  async streamChatCompletion(userPrompt: string, context: string) {
    return this.client.chat.completions.create({
      model: this.config.llmModel,
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        {
          role: 'user',
          content: `### CODE CONTEXT:\n${context}\n\n### USER QUESTION:\n${userPrompt}`,
        },
      ],
      temperature: 0.2,
      stream: true,
    });
  }
}

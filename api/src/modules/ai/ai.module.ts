import { Module } from '@nestjs/common';
import { LlmserviceService } from './llmservice.service';
import { EmbeddingService } from './embedding.service';

@Module({
  providers: [LlmserviceService, EmbeddingService],
  exports: [LlmserviceService, EmbeddingService],
})
export class AiModule {}

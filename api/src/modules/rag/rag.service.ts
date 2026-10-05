import { Injectable } from '@nestjs/common';
import { QueryDto } from './dto/query.dto';
import { EmbeddingService } from '../ai/embedding.service';
import { LlmserviceService } from '../ai/llmservice.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RagService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly llmService: LlmserviceService,
    private readonly prismaService: PrismaService,
  ) {}

  async generateReply(query: QueryDto) {
    const embedding = await this.embeddingService.embedText(query.query);

    const chunks = await this.prismaService.searchSimilarChunks(
      'repo-123',
      embedding,
      5,
    );

    return chunks;
  }
}

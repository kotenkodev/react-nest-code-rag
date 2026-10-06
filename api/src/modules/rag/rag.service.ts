import { Injectable, BadRequestException } from '@nestjs/common';
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

  async prepareRagStream(userEmail: string, question: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email: userEmail },
      include: { repository: true },
    });

    if (!user?.repositoryId) {
      throw new BadRequestException(
        'No indexed repository found for this user.',
      );
    }

    const embedding = await this.embeddingService.embedText(question);

    const chunks = await this.prismaService.searchSimilarChunks(
      user.repositoryId,
      embedding,
      5,
    );

    const sources = Array.from(
      new Set(chunks.map((c) => `${c.filePath}:${c.startLine}-${c.endLine}`)),
    );

    const context = chunks
      .map(
        (c) =>
          `File: ${c.filePath} (Lines ${c.startLine}-${c.endLine})\n\`\`\`\n${c.content}\n\`\`\``,
      )
      .join('\n\n');

    const stream = await this.llmService.streamChatCompletion(
      question,
      context,
    );

    return { stream, sources };
  }
}

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  searchSimilarChunks(
    repositoryId: string,
    queryEmbedding: number[],
    limit = 5,
  ) {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    return this.$queryRaw<
      Array<{
        id: string;
        filePath: string;
        content: string;
        startLine: number;
        endLine: number;
        similarity: number;
      }>
    >`
    SELECT id, "filePath", content, "startLine", "endLine",
           1 - (embedding <=> ${vectorStr}::vector) AS similarity
    FROM "CodeChunk"
    WHERE "repositoryId" = ${repositoryId}
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit};
  `;
  }

  async createCodeChunksBatch(
    chunks: Array<{
      repositoryId: string;
      filePath: string;
      content: string;
      startLine: number;
      endLine: number;
      embedding: number[];
    }>,
  ) {
    if (!chunks.length) return;

    for (const chunk of chunks) {
      const vectorStr = `[${chunk.embedding.join(',')}]`;
      const id = crypto.randomUUID();
      const sanitizedContent = (chunk.content || '').replace(/\0/g, '');
      const sanitizedFilePath = (chunk.filePath || '').replace(/\0/g, '');

      await this.$executeRaw`
        INSERT INTO "CodeChunk" ("id", "repositoryId", "filePath", "content", "startLine", "endLine", "createdAt", "embedding")
        VALUES (${id}, ${chunk.repositoryId}, ${sanitizedFilePath}, ${sanitizedContent}, ${chunk.startLine}, ${chunk.endLine}, NOW(), ${vectorStr}::vector);
      `;
    }
  }
}

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
}

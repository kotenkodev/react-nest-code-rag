import { Injectable, Logger } from '@nestjs/common';
import { RepositoryStatus } from '@prisma/client';
import { EmbeddingService } from '../ai/embedding.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChunkerService, FileToChunk } from './chunker.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly prismaService: PrismaService,
    private readonly chunkerService: ChunkerService,
  ) {}

  async ingestFiles(repositoryId: string, files: FileToChunk[]): Promise<void> {
    this.logger.log(
      `Starting ingestion for repository ${repositoryId} with ${files.length} total files.`,
    );

    try {
      await this.prismaService.repository.update({
        where: { id: repositoryId },
        data: {
          status: RepositoryStatus.PENDING,
          totalFilesCount: files.length,
          processedFilesCount: 0,
          errorMessage: null,
        },
      });

      // 1. Chunk all code files
      const chunks = this.chunkerService.chunkFiles(files);

      if (!chunks.length) {
        this.logger.warn(
          `No indexable code chunks found in ${files.length} files.`,
        );
        await this.prismaService.repository.update({
          where: { id: repositoryId },
          data: {
            status: ((RepositoryStatus as any).SUCCESS || (RepositoryStatus as any).COMPLETED || 'SUCCESS') as RepositoryStatus,
            processedFilesCount: files.length,
          },
        });
        return;
      }

      // 2. Generate embeddings in batches
      const batchSize = 16;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const batchTexts = batch.map(
          (c) => `File: ${c.filePath}\n${c.content}`,
        );

        const embeddings =
          await this.embeddingService.embedBatch(batchTexts);

        const chunksToInsert = batch.map((c, idx) => ({
          repositoryId,
          filePath: c.filePath,
          content: c.content,
          startLine: c.startLine,
          endLine: c.endLine,
          embedding: embeddings[idx],
        }));

        await this.prismaService.createCodeChunksBatch(chunksToInsert);

        const processedFiles = Math.min(
          Math.round(((i + batch.length) / chunks.length) * files.length),
          files.length,
        );

        await this.prismaService.repository.update({
          where: { id: repositoryId },
          data: {
            processedFilesCount: processedFiles,
          },
        });
      }

      await this.prismaService.repository.update({
        where: { id: repositoryId },
        data: {
          status: ((RepositoryStatus as any).SUCCESS || (RepositoryStatus as any).COMPLETED || 'SUCCESS') as RepositoryStatus,
          processedFilesCount: files.length,
        },
      });

      this.logger.log(
        `Ingestion complete for repository ${repositoryId}. Successfully saved ${chunks.length} chunks.`,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Ingestion failed for repository ${repositoryId}: ${errorMessage}`,
      );

      await this.prismaService.repository.update({
        where: { id: repositoryId },
        data: {
          status: RepositoryStatus.FAILED,
          errorMessage,
        },
      });
    }
  }
}

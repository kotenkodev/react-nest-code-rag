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

      const chunks = this.chunkerService.chunkFiles(files);

      if (!chunks.length) {
        this.logger.warn(
          `No indexable code chunks found in ${files.length} files.`,
        );
        await this.prismaService.repository.update({
          where: { id: repositoryId },
          data: {
            status: RepositoryStatus.SUCCESS,
            processedFilesCount: files.length,
          },
        });
        return;
      }

      const batchSize = 8;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const batchTexts = batch.map(
          (c) => `File: ${c.filePath}\n${c.content}`,
        );

        const embeddings = await this.embeddingService.embedBatch(batchTexts);

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

        if (i + batchSize < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }

      await this.prismaService.repository.update({
        where: { id: repositoryId },
        data: {
          status: RepositoryStatus.SUCCESS,
          processedFilesCount: files.length,
        },
      });

      this.logger.log(
        `Ingestion complete for repository ${repositoryId}. Successfully saved ${chunks.length} chunks.`,
      );
    } catch (err) {
      const rawError = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Ingestion failed for repository ${repositoryId}: ${rawError}`,
      );

      const errorMessage = this.formatErrorMessage(rawError);

      await this.prismaService.repository.update({
        where: { id: repositoryId },
        data: {
          status: RepositoryStatus.FAILED,
          errorMessage,
        },
      });
    }
  }

  private formatErrorMessage(rawError: string): string {
    const str = rawError.trim();

    if (
      str.includes('429') ||
      str.includes('RATE_TOKEN_LIMIT_EXCEEDED') ||
      str.toLowerCase().includes('rate limit exceeded')
    ) {
      return 'AI Embedding rate limit reached (100,000 tokens/min free tier limit). Please wait 30-60 seconds before retrying.';
    }

    if (
      str.includes('INPUT_TOKEN_LIMIT_EXCEEDED') ||
      str.toLowerCase().includes('exceeds the model')
    ) {
      return 'File chunks exceeded the token limit and could not be indexed.';
    }

    if (str.includes('404') && str.toLowerCase().includes('model')) {
      return 'AI model not found or unavailable. Please check API model configuration.';
    }

    if (str.includes('22021') || str.includes('invalid byte sequence')) {
      return 'Corrupted binary characters encountered during indexing.';
    }

    const jsonMatch = str.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed.detail === 'string') return parsed.detail;
        if (parsed.detail?.message) return parsed.detail.message;
        if (parsed.message) return parsed.message;
        if (parsed.error?.message) return parsed.error.message;
      } catch {
        // ignore
      }
    }

    return str.replace(/^Error:\s*/i, '');
  }
}

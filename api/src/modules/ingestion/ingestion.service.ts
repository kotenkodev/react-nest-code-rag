import { Injectable } from '@nestjs/common';
import { RepositoriesService } from 'src/modules/repositories/repositories.service';
import { EmbeddingService } from 'src/modules/ai/embedding.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ChunkerService } from './chunker.service';

@Injectable()
export class IngestionService {
  constructor(
    private repositoriesService: RepositoriesService,
    private embeddingService: EmbeddingService,
    private prismaService: PrismaService,
    private chunkerService: ChunkerService,
  ) {}
}

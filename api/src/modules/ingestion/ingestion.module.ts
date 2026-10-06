import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { ChunkerService } from './chunker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AiModule } from '../ai/ai.module';

@Module({
  providers: [ChunkerService, IngestionService],
  exports: [ChunkerService, IngestionService],
  imports: [PrismaModule, RepositoriesModule, AiModule, PrismaModule],
})
export class IngestionModule {}

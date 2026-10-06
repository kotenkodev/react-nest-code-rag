import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { ChunkerService } from './chunker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [ChunkerService, IngestionService],
  exports: [ChunkerService, IngestionService],
})
export class IngestionModule {}

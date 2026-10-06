import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [AiModule, PrismaModule, IngestionModule],
  controllers: [RagController],
  providers: [RagService],
})
export class RagModule {}

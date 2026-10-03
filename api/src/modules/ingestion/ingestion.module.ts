import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { ChunkerService } from './chunker.service';

@Module({
  providers: [ChunkerService, IngestionService],
})
export class IngestionModule {}

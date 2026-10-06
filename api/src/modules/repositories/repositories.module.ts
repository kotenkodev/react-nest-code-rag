import { Module } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { RepositoriesController } from './repositories.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [PrismaModule, IngestionModule],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}

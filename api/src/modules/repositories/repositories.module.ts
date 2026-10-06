import { Module } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { RepositoriesController } from './repositories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [RepositoriesService],
  controllers: [RepositoriesController],
  imports: [PrismaModule],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RepositoryLinkDto } from './dto/repository-link.dto';
import { RepositoriesService } from './repositories.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@Controller('repositories')
@UseGuards(AuthGuard)
export class RepositoriesController {
  private readonly logger = new Logger(RepositoriesController.name);

  constructor(
    private readonly repositoriesService: RepositoriesService,
    private readonly ingestionService: IngestionService,
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 500))
  async handleUpload(
    @CurrentUser() user: { email: string },
    @Body() body: RepositoryLinkDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
        fileIsRequired: false,
      }),
    )
    files?: Array<Express.Multer.File>,
  ) {
    if (body.link) {
      const { files: extractedFiles, zipUrl } =
        await this.repositoriesService.downloadGithubRepositoryZip(
          body.link,
          body.branch || 'main',
        );

      const repoName =
        body.link.split('/').filter(Boolean).pop()?.replace('.git', '') ||
        'github-repository';

      const repo = await this.repositoriesService.createOrResetRepository(
        user.email,
        repoName,
        body.link,
        extractedFiles.length,
      );

      // Start ingestion pipeline in background
      this.ingestionService
        .ingestFiles(repo.id, extractedFiles)
        .catch((err) =>
          this.logger.error(`Background ingestion error: ${err}`),
        );

      return {
        type: 'link',
        message: `Successfully downloaded repository. Ingestion in progress.`,
        zipUrl,
        repositoryId: repo.id,
        fileCount: extractedFiles.length,
        paths: extractedFiles.map((file) => file.path),
      };
    }

    if (files && files.length > 0) {
      const extractedFiles =
        this.repositoriesService.extractUploadedFiles(files);
      const isZipUpload = files.some(
        (f) =>
          f.mimetype === 'application/zip' ||
          f.mimetype === 'application/x-zip-compressed' ||
          f.originalname.toLowerCase().endsWith('.zip'),
      );

      const repoName = isZipUpload ? 'zip-archive' : 'uploaded-folder';

      const repo = await this.repositoriesService.createOrResetRepository(
        user.email,
        repoName,
        undefined,
        extractedFiles.length,
      );

      // Start ingestion pipeline in background
      this.ingestionService
        .ingestFiles(repo.id, extractedFiles)
        .catch((err) =>
          this.logger.error(`Background ingestion error: ${err}`),
        );

      return {
        type: isZipUpload ? 'zip' : 'folder',
        message: `Successfully uploaded ${extractedFiles.length} files. Ingestion in progress.`,
        repositoryId: repo.id,
        fileCount: extractedFiles.length,
        paths: extractedFiles.map((file) => file.path),
      };
    }

    return { error: 'No link or files provided.' };
  }

  @Get('status')
  getStatus(@CurrentUser() user: { email: string }) {
    return this.repositoriesService.getStatus(user.email);
  }

  @Delete()
  deleteRepository(@CurrentUser() user: { email: string }) {
    return this.repositoriesService.deleteRepository(user.email);
  }
}

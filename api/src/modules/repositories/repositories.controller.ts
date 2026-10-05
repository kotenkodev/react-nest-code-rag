import {
  Body,
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Sse,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RepositoryLinkDto } from './dto/repository-link.dto';
import { map, Observable } from 'rxjs';
import { RepositoriesService } from './repositories.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@Controller('repositories')
@UseGuards(AuthGuard)
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 500))
  async handleUpload(
    @CurrentUser() user,
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

      return {
        type: 'link',
        message: `Successfully downloaded and extracted repository from ${zipUrl}.`,
        zipUrl,
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

      return {
        type: isZipUpload ? 'zip' : 'folder',
        message: `Successfully processed ${extractedFiles.length} files.`,
        fileCount: extractedFiles.length,
        paths: extractedFiles.map((file) => file.path),
      };
    }

    return { error: 'No link or files provided.' };
  }

  @Sse(':id/status')
  streamStatus(
    @CurrentUser() user: { email: string },
  ): Observable<{ data: unknown }> {
    return this.repositoriesService
      .getStatusObservable(user.email)
      .pipe(map((progress) => ({ data: progress })));
  }
}

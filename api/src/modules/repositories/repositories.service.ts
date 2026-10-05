import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { from, map } from 'rxjs';
import AdmZip from 'adm-zip';
import { RepositoryStatus } from '@prisma/client';

export interface ExtractedFile {
  path: string;
  content: string;
  size: number;
}

@Injectable()
export class RepositoriesService {
  private readonly logger = new Logger(RepositoriesService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async createOrResetRepository(
    email: string,
    name: string,
    url?: string,
    totalFiles = 0,
  ) {
    const user = await this.prismaService.user.upsert({
      where: { email },
      create: { email },
      update: {},
    });

    if (user.repositoryId) {
      return this.prismaService.repository.update({
        where: { id: user.repositoryId },
        data: {
          name,
          url,
          totalFilesCount: totalFiles,
          processedFilesCount: 0,
          errorMessage: null,
          status: RepositoryStatus.PENDING,
          chunks: { deleteMany: {} },
        },
      });
    }

    const repo = await this.prismaService.repository.create({
      data: {
        name,
        url,
        totalFilesCount: totalFiles,
        processedFilesCount: 0,
        errorMessage: null,
        status: RepositoryStatus.PENDING,
      },
    });

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { repositoryId: repo.id },
    });

    return repo;
  }

  async updateProgress(repositoryId: string, processed: number, total: number) {
    return this.prismaService.repository.update({
      where: { id: repositoryId },
      data: {
        processedFilesCount: processed,
        totalFilesCount: total,
      },
    });
  }

  async setStatus(
    repositoryId: string,
    status: RepositoryStatus,
    errorMessage?: string,
  ) {
    return this.prismaService.repository.update({
      where: { id: repositoryId },
      data: {
        status,
        errorMessage: errorMessage || null,
      },
    });
  }

  buildGithubZipUrl(repoUrl: string, branch = 'main'): string {
    const trimmed = repoUrl.trim();
    if (trimmed.endsWith('.zip')) {
      return trimmed;
    }

    const cleaned = trimmed.replace(/\.git$/, '').replace(/\/+$/, '');
    const githubMatch = cleaned.match(
      /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)/,
    );

    if (githubMatch) {
      const [, owner, repo] = githubMatch;
      return `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;
    }

    const shorthandMatch = cleaned.match(
      /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/,
    );
    if (shorthandMatch) {
      const [, owner, repo] = shorthandMatch;
      return `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;
    }

    throw new BadRequestException('Invalid GitHub repository URL.');
  }

  async downloadGithubRepositoryZip(
    repoUrl: string,
    branch = 'main',
  ): Promise<{ files: ExtractedFile[]; zipUrl: string }> {
    const zipUrl = this.buildGithubZipUrl(repoUrl, branch);
    this.logger.log(`Downloading repository ZIP from: ${zipUrl}`);

    let response: Response;
    try {
      response = await fetch(zipUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Nest-Code-RAG-App',
        },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to reach GitHub: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to download repository zip from GitHub (HTTP ${response.status} ${response.statusText}). Verify that repository and branch "${branch}" exist.`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const files = this.parseZipBuffer(buffer, true);

    return { files, zipUrl };
  }

  extractUploadedFiles(files: Array<Express.Multer.File>): ExtractedFile[] {
    const extracted: ExtractedFile[] = [];

    for (const file of files) {
      const isZip =
        file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.toLowerCase().endsWith('.zip');

      if (isZip) {
        const zipFiles = this.parseZipBuffer(file.buffer, false);
        extracted.push(...zipFiles);
      } else {
        extracted.push({
          path: file.originalname,
          content: file.buffer ? file.buffer.toString('utf-8') : '',
          size: file.size,
        });
      }
    }

    return extracted;
  }

  private parseZipBuffer(
    buffer: Buffer,
    isGithubArchive = false,
  ): ExtractedFile[] {
    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      const files: ExtractedFile[] = [];

      for (const entry of entries) {
        if (entry.isDirectory) continue;

        let entryName = entry.entryName.replace(/\\/g, '/');

        // GitHub archives wrap everything in a root "{repo}-{branch}/" directory
        if (isGithubArchive) {
          const firstSlash = entryName.indexOf('/');
          if (firstSlash !== -1) {
            entryName = entryName.substring(firstSlash + 1);
          }
        }

        // Skip internal/hidden metadata files
        if (
          !entryName ||
          entryName.startsWith('.git/') ||
          entryName.includes('/.git/') ||
          entryName.startsWith('__MACOSX/') ||
          entryName.endsWith('.DS_Store')
        ) {
          continue;
        }

        try {
          const content = entry.getData().toString('utf-8');
          files.push({
            path: entryName,
            content,
            size: entry.header.size,
          });
        } catch {
          // If binary or unreadable as utf-8, preserve metadata with empty/placeholder content
          files.push({
            path: entryName,
            content: '',
            size: entry.header.size,
          });
        }
      }

      return files;
    } catch (err) {
      throw new BadRequestException(
        `Failed to parse ZIP archive: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async cloneGithubRepository(url: string, branch: string) {
    return this.downloadGithubRepositoryZip(url, branch);
  }

  getStatusObservable(email: string) {
    return from(
      this.prismaService.user.findUnique({
        where: { email },
        include: { repository: true },
      }),
    ).pipe(
      map((user) => ({
        status: user?.repository?.status || 'IDLE',
        processedFilesCount: user?.repository?.processedFilesCount || 0,
        totalFilesCount: user?.repository?.totalFilesCount || 0,
        errorMessage: user?.repository?.errorMessage || '',
      })),
    );
  }
}

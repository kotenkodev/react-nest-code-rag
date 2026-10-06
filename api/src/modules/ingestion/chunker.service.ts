import { Injectable, Logger } from '@nestjs/common';

export interface FileToChunk {
  path: string;
  content: string;
  size?: number;
}

export interface ChunkedItem {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
}

const IGNORED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  '.pdf',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.iso',
  '.map',
  '.lock',
  '.min.js',
  '.min.css',
]);

const IGNORED_FILENAMES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'tsconfig.tsbuildinfo',
  '.DS_Store',
]);

@Injectable()
export class ChunkerService {
  private readonly logger = new Logger(ChunkerService.name);

  private readonly maxChunkLines = 60;
  private readonly overlapLines = 15;
  private readonly maxChunkChars = 3500;

  shouldIgnoreFile(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/').toLowerCase();
    const parts = normalized.split('/');
    const fileName = parts[parts.length - 1];

    if (IGNORED_FILENAMES.has(fileName)) return true;
    if (normalized.startsWith('.git/') || normalized.includes('/.git/'))
      return true;
    if (
      normalized.startsWith('node_modules/') ||
      normalized.includes('/node_modules/')
    )
      return true;
    if (normalized.startsWith('dist/') || normalized.includes('/dist/'))
      return true;
    if (normalized.startsWith('build/') || normalized.includes('/build/'))
      return true;

    for (const ext of IGNORED_EXTENSIONS) {
      if (fileName.endsWith(ext)) return true;
    }

    return false;
  }

  chunkFiles(files: FileToChunk[]): ChunkedItem[] {
    const allChunks: ChunkedItem[] = [];

    for (const file of files) {
      if (!file.content || this.shouldIgnoreFile(file.path)) {
        continue;
      }

      const fileChunks = this.chunkSingleFile(file.path, file.content);
      allChunks.push(...fileChunks);
    }

    this.logger.log(
      `Chunked ${files.length} files into ${allChunks.length} searchable code chunks.`,
    );

    return allChunks;
  }

  chunkSingleFile(filePath: string, content: string): ChunkedItem[] {
    const lines = content.split(/\r?\n/);
    if (!lines.length || (lines.length === 1 && !lines[0].trim())) {
      return [];
    }

    // If small file with reasonable length, return single chunk
    if (lines.length <= this.maxChunkLines && content.length <= this.maxChunkChars) {
      return [
        {
          filePath,
          content: content.trim(),
          startLine: 1,
          endLine: lines.length,
        },
      ];
    }

    const chunks: ChunkedItem[] = [];
    let startIdx = 0;

    while (startIdx < lines.length) {
      let endIdx = Math.min(startIdx + this.maxChunkLines, lines.length);
      let chunkLines = lines.slice(startIdx, endIdx);
      let chunkText = chunkLines.join('\n').trim();

      // If text is still too large, reduce line window
      while (chunkText.length > this.maxChunkChars && endIdx > startIdx + 1) {
        endIdx = Math.floor((startIdx + endIdx) / 2);
        chunkLines = lines.slice(startIdx, endIdx);
        chunkText = chunkLines.join('\n').trim();
      }

      // Hard trim if a single line is absurdly long
      if (chunkText.length > this.maxChunkChars) {
        chunkText = chunkText.slice(0, this.maxChunkChars);
      }

      if (chunkText) {
        chunks.push({
          filePath,
          content: chunkText,
          startLine: startIdx + 1,
          endLine: endIdx,
        });
      }

      if (endIdx >= lines.length) break;
      const step = Math.max(1, endIdx - startIdx - this.overlapLines);
      startIdx += step;
    }

    return chunks;
  }
}

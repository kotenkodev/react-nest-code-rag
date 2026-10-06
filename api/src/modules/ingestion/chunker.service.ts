import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkerService {
  async chunk(
    files: Array<{
      filePath: string;
      content: string;
      fileName: string;
      fileType: string;
    }>,
    repositoryId: string,
    onFileProcessed?: (filePath: string, totalSize: number) => void,
  ) {
    const chunks: {
      chunkText: string;
      chunkNumber: number;
      fileName: string;
      filePath: string;
    }[] = [];
  }
}

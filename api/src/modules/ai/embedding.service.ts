import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  embedText(text: string): Promise<number[]> {
    if (!text) return Promise.resolve([]);
    return Promise.resolve(new Array<number>(1536).fill(0));
  }
}

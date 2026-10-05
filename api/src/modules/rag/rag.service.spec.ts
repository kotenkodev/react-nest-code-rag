import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';
import { EmbeddingService } from '../ai/embedding.service';
import { LlmserviceService } from '../ai/llmservice.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RagService', () => {
  let service: RagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: EmbeddingService, useValue: { embedText: jest.fn() } },
        { provide: LlmserviceService, useValue: {} },
        {
          provide: PrismaService,
          useValue: { searchSimilarChunks: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

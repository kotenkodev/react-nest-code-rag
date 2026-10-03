import { Test, TestingModule } from '@nestjs/testing';
import { LlmserviceService } from './llmservice.service';

describe('LlmserviceService', () => {
  let service: LlmserviceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmserviceService],
    }).compile();

    service = module.get<LlmserviceService>(LlmserviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

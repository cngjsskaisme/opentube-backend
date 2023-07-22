import { Test, TestingModule } from '@nestjs/testing';
import { LocalfileService } from './localfile.service';

describe('LocalfileService', () => {
  let service: LocalfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalfileService],
    }).compile();

    service = module.get<LocalfileService>(LocalfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { localVideoService } from './localvideo.service';

describe('VideoService', () => {
  let service: localVideoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [localVideoService],
    }).compile();

    service = module.get<localVideoService>(localVideoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

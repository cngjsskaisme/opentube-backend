import { Test, TestingModule } from '@nestjs/testing';
import { MediametaService } from './mediameta.service';

describe('MediametaService', () => {
  let service: MediametaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediametaService],
    }).compile();

    service = module.get<MediametaService>(MediametaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

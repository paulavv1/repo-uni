import { Test, TestingModule } from '@nestjs/testing';
import { CycleController } from './cycle.controller';
import { CycleService } from './cycle.service';

describe('CycleController', () => {
  let controller: CycleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CycleController],
      providers: [CycleService],
    }).compile();

    controller = module.get<CycleController>(CycleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

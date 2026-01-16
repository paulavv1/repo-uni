import { Test, TestingModule } from '@nestjs/testing';
import { StudentSubjectService } from './student-subject.service';

describe('StudentSubjectService', () => {
  let service: StudentSubjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentSubjectService],
    }).compile();

    service = module.get<StudentSubjectService>(StudentSubjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

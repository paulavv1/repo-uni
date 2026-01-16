import { Test, TestingModule } from '@nestjs/testing';
import { TeacherSubjectController } from './teacher-subject.controller';
import { TeacherSubjectService } from './teacher-subject.service';

describe('TeacherSubjectController', () => {
  let controller: TeacherSubjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeacherSubjectController],
      providers: [TeacherSubjectService],
    }).compile();

    controller = module.get<TeacherSubjectController>(TeacherSubjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

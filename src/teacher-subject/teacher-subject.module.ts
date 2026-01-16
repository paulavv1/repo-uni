import { Module } from '@nestjs/common';
import { TeacherSubjectService } from './teacher-subject.service';
import { TeacherSubjectController } from './teacher-subject.controller';

@Module({
  controllers: [TeacherSubjectController],
  providers: [TeacherSubjectService],
})
export class TeacherSubjectModule {}

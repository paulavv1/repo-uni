import { Module } from '@nestjs/common';
import { StudentSubjectService } from './student-subject.service';
import { StudentSubjectController } from './student-subject.controller';

@Module({
  controllers: [StudentSubjectController],
  providers: [StudentSubjectService],
})
export class StudentSubjectModule {}

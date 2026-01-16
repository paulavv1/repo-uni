import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentSubjectDto } from './create-student-subject.dto';

export class UpdateStudentSubjectDto extends PartialType(
  CreateStudentSubjectDto,
) {}

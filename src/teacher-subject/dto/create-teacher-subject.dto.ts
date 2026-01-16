import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateTeacherSubjectDto {
  @IsNotEmpty()
  @IsInt()
  teacherId: number;

  @IsNotEmpty()
  @IsInt()
  subjectId: number;
}

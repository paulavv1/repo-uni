import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateStudentSubjectDto {
  @IsNotEmpty()
  @IsInt()
  studentId: number;

  @IsNotEmpty()
  @IsInt()
  subjectId: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  grade?: number;

  @IsOptional()
  @IsBoolean()
  passed?: boolean;
}

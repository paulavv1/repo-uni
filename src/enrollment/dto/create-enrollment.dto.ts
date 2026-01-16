import { IsInt, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  @IsInt()
  studentId: number;

  @IsNotEmpty()
  @IsInt()
  subjectId: number;

  @IsNotEmpty()
  @IsInt()
  academicPeriodId: number;

  @IsOptional()
  @IsDateString()
  enrolledAt?: string;
}

import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  credits: number;

  @IsNotEmpty()
  @IsInt()
  careerId: number;

  @IsNotEmpty()
  @IsInt()
  cycleId: number;
}

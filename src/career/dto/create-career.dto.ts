import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCareerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  totalCycles: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationYears: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  specialtyId: number;
}

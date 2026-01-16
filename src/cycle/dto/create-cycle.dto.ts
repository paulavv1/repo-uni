import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateCycleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  number: number;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSpecialtyDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}

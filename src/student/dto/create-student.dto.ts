import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsInt,
  IsOptional,
} from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsInt()
  careerId: number;

  @IsNotEmpty()
  @IsInt()
  userId: number;
}

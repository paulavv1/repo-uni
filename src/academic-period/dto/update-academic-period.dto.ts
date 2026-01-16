import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicPeriodDto } from './create-academic-period.dto';

export class UpdateAcademicPeriodDto extends PartialType(
  CreateAcademicPeriodDto,
) {}

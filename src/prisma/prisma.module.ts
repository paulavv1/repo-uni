import { Module, Global } from '@nestjs/common';
import { PrismaAuthService } from './prisma-auth.service';
import { PrismaAcademicService } from './prisma-academic.service';
import { PrismaSupportService } from './prisma-support.service';

@Global()
@Module({
  providers: [PrismaAuthService, PrismaAcademicService, PrismaSupportService],
  exports: [PrismaAuthService, PrismaAcademicService, PrismaSupportService],
})
export class PrismaModule {}

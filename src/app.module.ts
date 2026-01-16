import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpecialtyModule } from './specialty/specialty.module';
import { CareerModule } from './career/career.module';
import { CycleModule } from './cycle/cycle.module';
import { SubjectModule } from './subject/subject.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentModule } from './student/student.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { TeacherSubjectModule } from './teacher-subject/teacher-subject.module';
import { StudentSubjectModule } from './student-subject/student-subject.module';
import { AuthModule } from './auth/auth.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AcademicPeriodModule } from './academic-period/academic-period.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SpecialtyModule,
    CareerModule,
    CycleModule,
    SubjectModule,
    TeacherModule,
    StudentModule,
    UserModule,
    TeacherSubjectModule,
    StudentSubjectModule,
    EnrollmentModule,
    AcademicPeriodModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

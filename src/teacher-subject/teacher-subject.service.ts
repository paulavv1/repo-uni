import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { CreateTeacherSubjectDto } from './dto/create-teacher-subject.dto';
import { UpdateTeacherSubjectDto } from './dto/update-teacher-subject.dto';

@Injectable()
export class TeacherSubjectService {
  constructor(private prismaAcademic: PrismaAcademicService) {}

  async create(createTeacherSubjectDto: CreateTeacherSubjectDto) {
    const teacher = await this.prismaAcademic.teacher.findUnique({
      where: { id: createTeacherSubjectDto.teacherId },
    });

    if (!teacher) {
      throw new BadRequestException(
        `Teacher with ID ${createTeacherSubjectDto.teacherId} not found`,
      );
    }

    const subject = await this.prismaAcademic.subject.findUnique({
      where: { id: createTeacherSubjectDto.subjectId },
    });

    if (!subject) {
      throw new BadRequestException(
        `Subject with ID ${createTeacherSubjectDto.subjectId} not found`,
      );
    }

    const existingRelation =
      await this.prismaAcademic.teacherSubject.findUnique({
        where: {
          teacherId_subjectId: {
            teacherId: createTeacherSubjectDto.teacherId,
            subjectId: createTeacherSubjectDto.subjectId,
          },
        },
      });

    if (existingRelation) {
      throw new ConflictException(
        'Teacher is already assigned to this subject',
      );
    }

    return this.prismaAcademic.teacherSubject.create({
      data: createTeacherSubjectDto,
      include: {
        teacher: true,
        subject: {
          include: {
            cycle: true,
            career: {
              include: {
                specialty: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.teacherSubject.findMany({
        skip,
        take: limit,
        include: {
          teacher: true,
          subject: {
            include: {
              cycle: true,
              career: {
                include: {
                  specialty: true,
                },
              },
            },
          },
        },
      }),
      this.prismaAcademic.teacherSubject.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const teacherSubject = await this.prismaAcademic.teacherSubject.findUnique({
      where: { id },
      include: {
        teacher: true,
        subject: {
          include: {
            cycle: true,
            career: {
              include: {
                specialty: true,
              },
            },
          },
        },
      },
    });

    if (!teacherSubject) {
      throw new NotFoundException(`TeacherSubject with ID ${id} not found`);
    }

    return teacherSubject;
  }

  async findByTeacher(teacherId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.teacherSubject.findMany({
        where: { teacherId },
        skip,
        take: limit,
        include: {
          subject: {
            include: {
              cycle: true,
              career: {
                include: {
                  specialty: true,
                },
              },
            },
          },
        },
      }),
      this.prismaAcademic.teacherSubject.count({
        where: { teacherId },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySubject(subjectId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.teacherSubject.findMany({
        where: { subjectId },
        skip,
        take: limit,
        include: {
          teacher: true,
        },
      }),
      this.prismaAcademic.teacherSubject.count({
        where: { subjectId },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: number, updateTeacherSubjectDto: UpdateTeacherSubjectDto) {
    await this.findOne(id);

    if (updateTeacherSubjectDto.teacherId) {
      const teacher = await this.prismaAcademic.teacher.findUnique({
        where: { id: updateTeacherSubjectDto.teacherId },
      });

      if (!teacher) {
        throw new BadRequestException(
          `Teacher with ID ${updateTeacherSubjectDto.teacherId} not found`,
        );
      }
    }

    if (updateTeacherSubjectDto.subjectId) {
      const subject = await this.prismaAcademic.subject.findUnique({
        where: { id: updateTeacherSubjectDto.subjectId },
      });

      if (!subject) {
        throw new BadRequestException(
          `Subject with ID ${updateTeacherSubjectDto.subjectId} not found`,
        );
      }
    }

    return this.prismaAcademic.teacherSubject.update({
      where: { id },
      data: updateTeacherSubjectDto,
      include: {
        teacher: true,
        subject: {
          include: {
            cycle: true,
            career: {
              include: {
                specialty: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.teacherSubject.delete({
      where: { id },
    });
  }
}

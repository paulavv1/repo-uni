import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeacherService {
  constructor(private prismaAcademic: PrismaAcademicService) {}

  create(createTeacherDto: CreateTeacherDto) {
    return this.prismaAcademic.teacher.create({
      data: createTeacherDto,
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.teacher.findMany({
        skip,
        take: limit,
        include: {
          subjects: {
            include: {
              subject: true,
            },
          },
        },
      }),
      this.prismaAcademic.teacher.count(),
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
    const teacher = await this.prismaAcademic.teacher.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                career: true,
                cycle: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto) {
    await this.findOne(id);

    return this.prismaAcademic.teacher.update({
      where: { id },
      data: updateTeacherDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.teacher.delete({
      where: { id },
    });
  }

  /**
   * Consulta derivada que identifica docentes asignados a dos o más asignaturas.
   * Se recuperan todos los docentes con sus asignaciones y se filtra a nivel de aplicación
   * aquellos cuya cantidad de relaciones teacher_subject sea superior a uno.
   * Se incluye un campo calculado totalSubjects para facilitar el análisis posterior.
   */
  async findTeachingMultipleSubjects() {
    const teachers = await this.prismaAcademic.teacher.findMany({
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                career: true,
                cycle: true,
              },
            },
          },
        },
      },
    });

    const teachersWithMultipleSubjects = teachers.filter(
      (teacher) => teacher.subjects.length > 1,
    );

    return teachersWithMultipleSubjects.map((teacher) => ({
      ...teacher,
      totalSubjects: teacher.subjects.length,
    }));
  }

  /**
   * Implementa un filtro utilizando operadores lógicos complejos: AND, OR y NOT.
   * Se retornan docentes que satisfagan la siguiente lógica:
   * - Tipo de empleo debe ser tiempo completo (FULL_TIME) Y
   * - Al menos una de estas condiciones:
   *   - Tiene asignaturas asignadas O
   *   - Su estado NO es inactivo (equivalente a isActive = true)
   * Esta consulta demuestra el uso de operadores lógicos anidados en Prisma ORM.
   */
  async findWithComplexFilter() {
    const teachers = await this.prismaAcademic.teacher.findMany({
      where: {
        AND: [
          {
            employmentType: 'FULL_TIME',
          },
          {
            OR: [
              {
                subjects: {
                  some: {},
                },
              },
              {
                NOT: {
                  isActive: false,
                },
              },
            ],
          },
        ],
      },
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                career: true,
                cycle: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    return teachers.map((teacher) => ({
      ...teacher,
      totalSubjects: teacher.subjects.length,
    }));
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectService {
  constructor(private prismaAcademic: PrismaAcademicService) {}

  async create(createSubjectDto: CreateSubjectDto) {
    const [career, cycle] = await Promise.all([
      this.prismaAcademic.career.findUnique({
        where: { id: createSubjectDto.careerId },
      }),
      this.prismaAcademic.cycle.findUnique({
        where: { id: createSubjectDto.cycleId },
      }),
    ]);

    if (!career) {
      throw new BadRequestException(
        `Career with ID ${createSubjectDto.careerId} not found`,
      );
    }

    if (!cycle) {
      throw new BadRequestException(
        `Cycle with ID ${createSubjectDto.cycleId} not found`,
      );
    }

    return this.prismaAcademic.subject.create({
      data: createSubjectDto,
      include: {
        career: true,
        cycle: true,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.subject.findMany({
        skip,
        take: limit,
        include: {
          career: true,
          cycle: true,
        },
      }),
      this.prismaAcademic.subject.count(),
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
    const subject = await this.prismaAcademic.subject.findUnique({
      where: { id },
      include: {
        career: true,
        cycle: true,
        teachers: {
          include: {
            teacher: true,
          },
        },
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return subject;
  }

  async update(id: number, updateSubjectDto: UpdateSubjectDto) {
    await this.findOne(id);

    if (updateSubjectDto.careerId) {
      const career = await this.prismaAcademic.career.findUnique({
        where: { id: updateSubjectDto.careerId },
      });

      if (!career) {
        throw new BadRequestException(
          `Career with ID ${updateSubjectDto.careerId} not found`,
        );
      }
    }

    if (updateSubjectDto.cycleId) {
      const cycle = await this.prismaAcademic.cycle.findUnique({
        where: { id: updateSubjectDto.cycleId },
      });

      if (!cycle) {
        throw new BadRequestException(
          `Cycle with ID ${updateSubjectDto.cycleId} not found`,
        );
      }
    }

    return this.prismaAcademic.subject.update({
      where: { id },
      data: updateSubjectDto,
      include: {
        career: true,
        cycle: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.subject.delete({
      where: { id },
    });
  }

  /**
   * Consulta derivada que retorna las materias pertenecientes a una carrera específica.
   * Se incluyen las relaciones con career, specialty y cycle, ordenando los resultados
   * primero por número de ciclo en orden ascendente y luego alfabéticamente por nombre de materia.
   * Esta ordenación facilita la presentación lógica del plan de estudios.
   */
  async findByCareer(careerId: number) {
    const career = await this.prismaAcademic.career.findUnique({
      where: { id: careerId },
    });

    if (!career) {
      throw new NotFoundException(`Career with ID ${careerId} not found`);
    }

    return this.prismaAcademic.subject.findMany({
      where: {
        careerId,
      },
      include: {
        career: {
          include: {
            specialty: true,
          },
        },
        cycle: true,
      },
      orderBy: [{ cycle: { number: 'asc' } }, { name: 'asc' }],
    });
  }
}

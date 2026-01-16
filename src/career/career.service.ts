import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';

@Injectable()
export class CareerService {
  constructor(private prismaAcademic: PrismaAcademicService) {}

  async create(createCareerDto: CreateCareerDto) {
    const specialty = await this.prismaAcademic.specialty.findUnique({
      where: { id: createCareerDto.specialtyId },
    });

    if (!specialty) {
      throw new BadRequestException(
        `Specialty with ID ${createCareerDto.specialtyId} not found`,
      );
    }

    return this.prismaAcademic.career.create({
      data: createCareerDto,
      include: {
        specialty: true,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.career.findMany({
        skip,
        take: limit,
        include: {
          specialty: true,
        },
      }),
      this.prismaAcademic.career.count(),
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
    const career = await this.prismaAcademic.career.findUnique({
      where: { id },
      include: {
        specialty: true,
        students: true,
        subjects: true,
      },
    });

    if (!career) {
      throw new NotFoundException(`Career with ID ${id} not found`);
    }

    return career;
  }

  async update(id: number, updateCareerDto: UpdateCareerDto) {
    await this.findOne(id);

    if (updateCareerDto.specialtyId) {
      const specialty = await this.prismaAcademic.specialty.findUnique({
        where: { id: updateCareerDto.specialtyId },
      });

      if (!specialty) {
        throw new BadRequestException(
          `Specialty with ID ${updateCareerDto.specialtyId} not found`,
        );
      }
    }

    return this.prismaAcademic.career.update({
      where: { id },
      data: updateCareerDto,
      include: {
        specialty: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.career.delete({
      where: { id },
    });
  }
}

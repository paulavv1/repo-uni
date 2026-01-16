import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtyService {
  constructor(private prismaAcademic: PrismaAcademicService) {}

  create(createSpecialtyDto: CreateSpecialtyDto) {
    return this.prismaAcademic.specialty.create({
      data: createSpecialtyDto,
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.specialty.findMany({
        skip,
        take: limit,
        include: {
          careers: true,
        },
      }),
      this.prismaAcademic.specialty.count(),
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
    const specialty = await this.prismaAcademic.specialty.findUnique({
      where: { id },
      include: {
        careers: true,
      },
    });

    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }

    return specialty;
  }

  async update(id: number, updateSpecialtyDto: UpdateSpecialtyDto) {
    await this.findOne(id);

    return this.prismaAcademic.specialty.update({
      where: { id },
      data: updateSpecialtyDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.specialty.delete({
      where: { id },
    });
  }
}

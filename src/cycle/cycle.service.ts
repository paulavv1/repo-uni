import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';

@Injectable()
export class CycleService {
  constructor(private prismaAcademic: PrismaAcademicService) {}

  create(createCycleDto: CreateCycleDto) {
    return this.prismaAcademic.cycle.create({
      data: createCycleDto,
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAcademic.cycle.findMany({
        skip,
        take: limit,
        include: {
          subjects: true,
        },
      }),
      this.prismaAcademic.cycle.count(),
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
    const cycle = await this.prismaAcademic.cycle.findUnique({
      where: { id },
      include: {
        subjects: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException(`Cycle with ID ${id} not found`);
    }

    return cycle;
  }

  async update(id: number, updateCycleDto: UpdateCycleDto) {
    await this.findOne(id);

    return this.prismaAcademic.cycle.update({
      where: { id },
      data: updateCycleDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.cycle.delete({
      where: { id },
    });
  }
}

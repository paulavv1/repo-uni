import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';

@Injectable()
export class AcademicPeriodService {
  constructor(private prismaAcademic: PrismaAcademicService) {}

  async create(createAcademicPeriodDto: CreateAcademicPeriodDto) {
    const exists = await this.prismaAcademic.academicPeriod.findUnique({
      where: { name: createAcademicPeriodDto.name },
    });

    if (exists) {
      throw new BadRequestException(
        `Academic period with name ${createAcademicPeriodDto.name} already exists`,
      );
    }

    return this.prismaAcademic.academicPeriod.create({
      data: {
        ...createAcademicPeriodDto,
        startDate: new Date(createAcademicPeriodDto.startDate),
        endDate: new Date(createAcademicPeriodDto.endDate),
      },
    });
  }

  async findAll() {
    return this.prismaAcademic.academicPeriod.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async findActive() {
    return this.prismaAcademic.academicPeriod.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const period = await this.prismaAcademic.academicPeriod.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            student: true,
            subject: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException(`Academic period with ID ${id} not found`);
    }

    return period;
  }

  async update(id: number, updateAcademicPeriodDto: UpdateAcademicPeriodDto) {
    await this.findOne(id);

    const updateData: any = { ...updateAcademicPeriodDto };

    if (updateAcademicPeriodDto.startDate) {
      updateData.startDate = new Date(updateAcademicPeriodDto.startDate);
    }
    if (updateAcademicPeriodDto.endDate) {
      updateData.endDate = new Date(updateAcademicPeriodDto.endDate);
    }

    return this.prismaAcademic.academicPeriod.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAcademic.academicPeriod.delete({
      where: { id },
    });
  }
}

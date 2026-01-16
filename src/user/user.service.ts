import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaAuthService } from '../prisma/prisma-auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prismaAuth: PrismaAuthService) {}

  async create(createUserDto: CreateUserDto) {
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    try {
      return await this.prismaAuth.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });
    } catch (error) {
      throw new ConflictException('El email o username ya existe');
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaAuth.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          createdAt: true,
        },
      }),
      this.prismaAuth.user.count(),
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
    const user = await this.prismaAuth.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    // Hash de la contraseña si se actualiza
    const dataToUpdate = { ...updateUserDto };
    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    try {
      return await this.prismaAuth.user.update({
        where: { id },
        data: dataToUpdate,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });
    } catch (error) {
      throw new ConflictException('El email o username ya existe');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaAuth.user.delete({
      where: { id },
    });
  }
}

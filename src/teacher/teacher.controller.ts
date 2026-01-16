import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.create(createTeacherDto);
  }

  /**
   * Retorna docentes que imparten dos o más asignaturas en el sistema.
   * El filtrado se realiza a nivel de aplicación contando las relaciones
   * en la entidad intermedia teacher_subjects.
   */
  @Get('multiple-subjects')
  findTeachingMultipleSubjects() {
    return this.teacherService.findTeachingMultipleSubjects();
  }

  /**
   * Aplica un filtro complejo que combina operadores lógicos AND, OR y NOT.
   * Retorna docentes de tiempo completo que cumplan al menos una de dos condiciones:
   * dictar asignaturas o estar en estado activo.
   */
  @Get('filter-complex')
  findWithComplexFilter() {
    return this.teacherService.findWithComplexFilter();
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.teacherService.findAll(parseInt(page), parseInt(limit));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teacherService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teacherService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teacherService.remove(id);
  }
}

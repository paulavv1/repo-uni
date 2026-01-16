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
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  /**
   * Retorna todos los estudiantes que se encuentran activos en el sistema,
   * incluyendo la información completa de su carrera y especialidad asociada.
   * Esta consulta forma parte de los requerimientos de consultas derivadas con ORM.
   */
  @Get('active-with-career')
  findActiveWithCareer() {
    return this.studentService.findActiveWithCareer();
  }

  /**
   * Aplica un filtro compuesto utilizando operadores lógicos AND para retornar
   * estudiantes que cumplan simultáneamente tres condiciones: estar activos,
   * pertenecer a una carrera específica y tener matrículas en un periodo académico dado.
   */
  @Get('filter')
  findActiveByCareerAndPeriod(
    @Query('careerId', ParseIntPipe) careerId: number,
    @Query('periodId', ParseIntPipe) periodId: number,
  ) {
    return this.studentService.findActiveByCareerAndPeriod(careerId, periodId);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.studentService.findAll(parseInt(page), parseInt(limit));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.remove(id);
  }
}

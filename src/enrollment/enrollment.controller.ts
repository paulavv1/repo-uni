import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  /**
   * Ejecuta una transacción ACID completa para matricular un estudiante en una materia.
   * Se validan todas las reglas de negocio y se garantiza atomicidad mediante el uso
   * de transacciones explícitas de Prisma.
   */
  @Post()
  enrollStudent(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentService.enrollStudent(createEnrollmentDto);
  }

  /**
   * Genera un reporte mediante consulta SQL nativa ejecutada con $queryRaw.
   * Retorna el nombre completo del estudiante, su carrera y el número total
   * de materias en las que se encuentra matriculado, ordenado descendentemente.
   */
  @Get('report')
  getEnrollmentReport() {
    return this.enrollmentService.getEnrollmentReport();
  }

  /**
   * Retorna todas las matrículas de un estudiante específico en un periodo académico determinado.
   * Esta consulta derivada incluye información completa de la materia, carrera, ciclo y periodo.
   */
  @Get('student/:studentId/period/:periodId')
  getStudentEnrollmentsByPeriod(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('periodId', ParseIntPipe) periodId: number,
  ) {
    return this.enrollmentService.getStudentEnrollmentsByPeriod(
      studentId,
      periodId,
    );
  }

  @Get()
  findAll() {
    return this.enrollmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentService.remove(id);
  }
}

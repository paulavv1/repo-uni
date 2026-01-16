import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

interface EnrollmentReportRow {
  student_name: string;
  career_name: string;
  total_subjects: bigint;
}

@Injectable()
export class EnrollmentService {
  constructor(private prismaAcademic: PrismaAcademicService) {}

  /**
   * Ejecuta una transacción ACID completa para matricular un estudiante en una materia.
   * Se implementan los cuatro principios:
   * - Atomicidad: Todo el proceso se ejecuta o ninguna parte mediante $transaction
   * - Consistencia: Validaciones de negocio garantizan estados válidos del sistema
   * - Aislamiento: UPDATE con WHERE previene race conditions en decrementos de cupos
   * - Durabilidad: PostgreSQL garantiza persistencia de cambios confirmados
   */
  async enrollStudent(createEnrollmentDto: CreateEnrollmentDto) {
    return this.prismaAcademic.$transaction(async (prisma) => {
      // Validación de existencia y estado activo del estudiante
      const student = await prisma.student.findUnique({
        where: { id: createEnrollmentDto.studentId },
      });

      if (!student) {
        throw new NotFoundException(
          `Student with ID ${createEnrollmentDto.studentId} not found`,
        );
      }

      if (!student.isActive) {
        throw new BadRequestException(
          `Student with ID ${createEnrollmentDto.studentId} is not active`,
        );
      }

      // Validación de existencia de la materia
      const subject = await prisma.subject.findUnique({
        where: { id: createEnrollmentDto.subjectId },
      });

      if (!subject) {
        throw new NotFoundException(
          `Subject with ID ${createEnrollmentDto.subjectId} not found`,
        );
      }

      // Validación de existencia y estado activo del periodo académico
      const academicPeriod = await prisma.academicPeriod.findUnique({
        where: { id: createEnrollmentDto.academicPeriodId },
      });

      if (!academicPeriod) {
        throw new NotFoundException(
          `Academic period with ID ${createEnrollmentDto.academicPeriodId} not found`,
        );
      }

      if (!academicPeriod.isActive) {
        throw new BadRequestException(
          `Academic period "${academicPeriod.name}" is not active`,
        );
      }

      // Verificación de disponibilidad de cupos antes del intento de matrícula
      if (subject.availableQuota <= 0) {
        throw new BadRequestException(
          `No available quota for subject "${subject.name}"`,
        );
      }

      // Validación contra matrículas duplicadas utilizando el constraint unique compuesto
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_subjectId_academicPeriodId: {
            studentId: createEnrollmentDto.studentId,
            subjectId: createEnrollmentDto.subjectId,
            academicPeriodId: createEnrollmentDto.academicPeriodId,
          },
        },
      });

      if (existingEnrollment) {
        throw new ConflictException(
          `Student is already enrolled in this subject for the selected academic period`,
        );
      }

      /**
       * Decremento atómico del cupo disponible con condición WHERE.
       * Esta implementación maneja correctamente escenarios de concurrencia:
       * si dos procesos intentan decrementar simultáneamente el último cupo,
       * solo uno tendrá éxito mientras el otro recibirá count = 0.
       */
      const updateResult = await prisma.subject.updateMany({
        where: {
          id: createEnrollmentDto.subjectId,
          availableQuota: {
            gt: 0,
          },
        },
        data: {
          availableQuota: {
            decrement: 1,
          },
        },
      });

      // Si count = 0, otro proceso concurrente tomó el último cupo
      if (updateResult.count === 0) {
        throw new BadRequestException(
          `No available quota for subject "${subject.name}" (concurrent enrollment)`,
        );
      }

      // Registro de la matrícula con todas las relaciones incluidas
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: createEnrollmentDto.studentId,
          subjectId: createEnrollmentDto.subjectId,
          academicPeriodId: createEnrollmentDto.academicPeriodId,
          enrolledAt: createEnrollmentDto.enrolledAt
            ? new Date(createEnrollmentDto.enrolledAt)
            : new Date(),
        },
        include: {
          student: true,
          subject: {
            include: {
              career: true,
              cycle: true,
            },
          },
          academicPeriod: true,
        },
      });

      return {
        message: 'Student successfully enrolled',
        enrollment,
      };
    });
  }

  /**
   * Consulta derivada que retorna las matrículas de un estudiante en un periodo académico específico.
   * Se incluyen las relaciones completas con subject, career, cycle y academic period
   * para proporcionar contexto completo de cada matrícula.
   */
  async getStudentEnrollmentsByPeriod(
    studentId: number,
    academicPeriodId: number,
  ) {
    const student = await this.prismaAcademic.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const period = await this.prismaAcademic.academicPeriod.findUnique({
      where: { id: academicPeriodId },
    });

    if (!period) {
      throw new NotFoundException(
        `Academic period with ID ${academicPeriodId} not found`,
      );
    }

    const enrollments = await this.prismaAcademic.enrollment.findMany({
      where: {
        studentId,
        academicPeriodId,
      },
      include: {
        subject: {
          include: {
            career: true,
            cycle: true,
          },
        },
        academicPeriod: true,
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
      },
      academicPeriod: {
        id: period.id,
        name: period.name,
      },
      enrollments,
      totalEnrolled: enrollments.length,
    };
  }

  /**
   * Implementa una consulta SQL nativa mediante $queryRaw para generar un reporte.
   * La query ejecuta un JOIN entre students, careers y enrollments, agrupando por estudiante
   * y contando el número total de matrículas. Se filtran estudiantes sin matrículas mediante
   * HAVING y se ordena descendentemente por cantidad de materias matriculadas.
   * La conversión de bigint a number es necesaria para la serialización JSON.
   */
  async getEnrollmentReport() {
    const rawResults = await this.prismaAcademic.$queryRaw<
      EnrollmentReportRow[]
    >`
      SELECT 
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        c.name as career_name,
        COUNT(e.id)::bigint as total_subjects
      FROM students s
      INNER JOIN careers c ON s.career_id = c.id
      LEFT JOIN enrollments e ON s.id = e.student_id
      GROUP BY s.id, s.first_name, s.last_name, c.name
      HAVING COUNT(e.id) > 0
      ORDER BY total_subjects DESC
    `;

    // Conversión de tipos BigInt a Number para compatibilidad con JSON
    const results = rawResults.map((row) => ({
      studentName: row.student_name,
      careerName: row.career_name,
      totalSubjects: Number(row.total_subjects),
    }));

    return {
      report: results,
      totalStudents: results.length,
      generatedAt: new Date().toISOString(),
    };
  }

  async findAll() {
    return this.prismaAcademic.enrollment.findMany({
      include: {
        student: true,
        subject: {
          include: {
            career: true,
            cycle: true,
          },
        },
        academicPeriod: true,
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const enrollment = await this.prismaAcademic.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            career: true,
          },
        },
        subject: {
          include: {
            career: true,
            cycle: true,
          },
        },
        academicPeriod: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    return enrollment;
  }

  /**
   * Elimina una matrícula y devuelve el cupo a la materia mediante una transacción.
   * Se garantiza que el incremento del cupo y la eliminación del registro ocurran atómicamente,
   * evitando inconsistencias en caso de fallos durante el proceso.
   */
  async remove(id: number) {
    const enrollment = await this.findOne(id);

    return this.prismaAcademic.$transaction(async (prisma) => {
      // Incremento del cupo disponible
      await prisma.subject.update({
        where: { id: enrollment.subjectId },
        data: {
          availableQuota: {
            increment: 1,
          },
        },
      });

      // Eliminación del registro de matrícula
      return prisma.enrollment.delete({
        where: { id },
      });
    });
  }
}

# ANÁLISIS TÉCNICO COMPLETO - ACTIVIDAD PRÁCTICA CLASE 3
## Sistema de Gestión Académica Universitaria con NestJS

**Desarrollado por:** Paula Verdugo  
**Institución:** Instituto Sudamericano  
**Fecha:** Enero 21 2026  
**Asignatura:** Herramientas informaticas para el despliqgue de diagramas

---

## 📋 TABLA DE CONTENIDOS

1. [Introducción](#introducción)
2. [Análisis de Principios ACID](#análisis-de-principios-acid)
3. [Parte 1: Consultas Derivadas](#parte-1-consultas-derivadas)
4. [Parte 2: Operaciones Lógicas](#parte-2-operaciones-lógicas)
5. [Parte 3: Consulta SQL Nativa](#parte-3-consulta-sql-nativa)
6. [Parte 4: Transacciones ACID](#parte-4-transacciones-acid)
7. [Conclusiones](#conclusiones)

---

## INTRODUCCIÓN

El presente documento detalla la implementación de operaciones avanzadas de base de datos en un sistema universitario desarrollado con NestJS y Prisma ORM. Se abordan consultas derivadas, operadores lógicos complejos, consultas SQL nativas y transacciones ACID, demostrando el dominio de conceptos fundamentales en ingeniería de datos y persistencia.

El proyecto gestiona:
- **Estudiantes**: Con información de carrera, ciclo académico y estado activo
- **Docentes**: Con asignación de múltiples asignaturas
- **Carreras**: Organizadas por especialidades
- **Asignaturas**: Con ciclos, cupos disponibles y asociación a carreras
- **Matrículas**: Proceso crítico que requiere transacciones ACID

**Arquitectura Base de Datos:**
- 3 bases de datos PostgreSQL independientes (Auth, Academic, Support)
- ORM: Prisma
- Separación por dominios respetando principios SOLID

---

## ANÁLISIS DE PRINCIPIOS ACID

### 1. ATOMICIDAD EN LA MATRICULACIÓN

**¿Cómo se aplica?**

La atomicidad en la matriculación se implementa mediante transacciones explícitas en **`src/enrollment/enrollment.service.ts`** (línea 22) usando `$transaction()` de Prisma. Esto garantiza que el proceso de matriculación es **TODO O NADA**:

**Código Implementado:**

```typescript
async enrollStudent(createEnrollmentDto: CreateEnrollmentDto) {
  return this.prismaAcademic.$transaction(async (prisma) => {
    // Todas las operaciones dentro de $transaction son atómicas
    // Si falla cualquiera, toda la transacción se revierte
    
    const student = await prisma.student.findUnique(...);
    if (!student) throw new NotFoundException(...);
    
    const subject = await prisma.subject.findUnique(...);
    if (!subject) throw new NotFoundException(...);
    
    const updateResult = await prisma.subject.updateMany({
      where: { id: ..., availableQuota: { gt: 0 } },
      data: { availableQuota: { decrement: 1 } }
    });
    
    const enrollment = await prisma.enrollment.create({...});
    return enrollment;
  });
}
```

**Importancia Práctica:**

En un sistema universitario, la atomicidad es **crítica** porque:
- Si un estudiante se matricula pero el cupo NO se decrementa → Inconsistencia total
- Si el cupo se decrementa pero la matrícula falla → Cupo perdido injustamente
- **Solución:** La transacción garantiza que AMBAS operaciones ocurren juntas o NINGUNA

**Operaciones Atómicas en Transacción:**
1. Validar que el estudiante existe y está activo
2. Validar que la materia existe y tiene cupos
3. Verificar que el período académico está activo
4. Decrementar cupo disponible (UPDATE atómico)
5. Crear registro de matrícula

**Si alguno falla → ROLLBACK completo → Base de datos intacta**

---

### 2. CONSISTENCIA DE DATOS

**¿Qué garantiza?**

La consistencia se implementa en múltiples niveles en **`src/enrollment/enrollment.service.ts`** (líneas 30-99)72 . Garantiza que la base de datos SIEMPRE está en un estado válido:

**Capas de Validación Implementadas:**

| Capa | Validación | Impacto |
|------|-----------|---------|
| 1 | Estudiante existe y está activo | No permite matricular inactivos |
| 2 | Materia existe con cupos > 0 | No permite sobrematriculación |
| 3 | Período académico existe y activo | No permite matricular fuera de período |
| 4 | Constraint UNIQUE (estudiante-materia-período) | No permite duplicados |
| 5 | availableQuota nunca negativo | Integridad referencial |

**Restricción de Consistencia en BD (schema-academic.prisma):**
```prisma
@@unique([studentId, subjectId, academicPeriodId])  ← Previene duplicados
availableQuota Int @default(0)                     ← No puede ser negativo
```

**Estado Inicial vs Final Válido:**
```
ANTES:
- Estudiante: activo ✓
- Materia: 30 cupos disponibles ✓
- Período: activo ✓

DESPUÉS:
- Estudiante: activo ✓ (sin cambios)
- Materia: 29 cupos disponibles ✓ (decrmentado)
- Período: activo ✓ (sin cambios)
- NUEVA matrícula registrada ✓

NUNCA estados como: cupo negativo, matrícula sin decrementar cupo, estudiante inactivo matriculado
```

---

### 3. AISLAMIENTO EN MATRICULACIÓN CONCURRENTE

**¿Cómo se maneja cuando varios estudiantes se matriculan simultáneamente?**

El aislamiento previene **race conditions** cuando múltiples estudiantes intentan matricularse en la última matrícula disponible. Implementado en **`src/enrollment/enrollment.service.ts`** (líneas 105-130):

**Escenario Real: Última Matrícula Disponible**

```
Materia XYZ tiene 1 cupo disponible (availableQuota = 1)
Estudiante A y B intentan matricularse al MISMO TIEMPO

TIEMPO T1:
Estudiante A: Verifica cupo > 0 ✓
Estudiante B: Verifica cupo > 0 ✓ (ambos ven 1 cupo)

TIEMPO T2:
Estudiante A: UPDATE materia SET availableQuota = 0 WHERE id=XYZ AND availableQuota > 0
               → count = 1 ✓ (afectó 1 fila) → A gana
Estudiante B: UPDATE materia SET availableQuota = 0 WHERE id=XYZ AND availableQuota > 0
               → count = 0 ✗ (no afectó filas) → B pierde y recibe excepción
```

**Código Crítico - Decremento Atómico:**
```typescript
const updateResult = await prisma.subject.updateMany({
  where: {
    id: subjectId,
    availableQuota: { gt: 0 }  // ← CONDICIÓN CRÍTICA
  },
  data: {
    availableQuota: { decrement: 1 }
  }
});

if (updateResult.count === 0) {
  throw new BadRequestException(
    `No available quota (concurrent enrollment)`
  );
}
```

**¿Por qué funciona?**
- PostgreSQL **ejecuta UPDATE atómicamente** a nivel de BD
- La condición `availableQuota > 0` forma parte de la operación
- Solo UNA transacción puede satisfacer la condición cuando quota=1
- La otra transacción recibe `count=0` y se revierte

**Problemas Evitados:**
- ❌ Lost Update: Ambos estudiantes se matriculan (cupo negativo)
- ❌ Dirty Read: Ver cupos que se restan en otra transacción
- ❌ Phantom Read: Aparecer/desaparecer de matrículas durante consulta


---

### 4. DURABILIDAD EN SISTEMA UNIVERSITARIO

**¿Por qué es importante?**

La durabilidad garantiza que una vez que se confirma una matrícula, **persiste permanentemente** incluso si:
- El servidor falla
- La electricidad se va
- La BD se reinicia
- Hay corte de internet

**Implementación: PostgreSQL Write-Ahead Logging (WAL)**

En **`src/enrollment/enrollment.service.ts`**, cuando la transacción termina:

```typescript
async enrollStudent(...) {
  return this.prismaAcademic.$transaction(async (prisma) => {
    // ... validaciones y operaciones ...
    
    const enrollment = await prisma.enrollment.create({...});
    return enrollment;
    
    // ← COMMIT ejecutado automáticamente
    // ← Datos guardados permanentemente en disco
  });
}
```

**Proceso de Durabilidad:**
1. PostgreSQL escribe cambios en **WAL (Write-Ahead Log)** en disco
2. Aplica cambios en la BD
3. Ejecuta COMMIT (confirmación)
4. Cambios están **permanentemente guardados**

**Impacto en Universidad:**

```
ESCENARIO: Matrícula de estudiante en última disponible (1 cupo)

FALLO DEL SERVIDOR A MITAD DE TRANSACCIÓN:
- Si ANTES de COMMIT: Matrícula NO se crea, cupo intacto, rollback automático
- Si DESPUÉS de COMMIT: Matrícula persiste, cupo decrmentado permanentemente

RESULTADO: Nunca hay estado inconsistente
```

**Ejemplos de Relevancia:**
- ✅ **Matrícula confirmada**: Estudiante ya está registrado (nadie puede quitarla)
- ✅ **Cupo decrmentado**: Otro estudiante no puede tomar el mismo cupo
- ✅ **Récord auditoria**: Se registra quién se matriculó y cuándo
- ❌ **NUNCA**: "Se procesó la matrícula pero se perdió por fallo del servidor"

**Garantía en el Código:**

El uso de `$transaction()` en Prisma garantiza:
- Atomicidad + Durabilidad = Matrícula confiable
- PostgreSQL + WAL = Recuperación ante fallos
- Backups regulares = Recuperación ante desastres

**Conclusión:** En un sistema universitario, la durabilidad es **CRÍTICA** porque:
- Las matrículas son legales y permanentes
- Los estudiantes confían en que su matriculación persiste
- La auditoría y récords académicos deben ser confiables
- No puede haber pérdida de datos por fallos técnicos


---

## PARTE 1: CONSULTAS DERIVADAS

### Requisito 1.1: Listar estudiantes activos con su carrera

**Ubicación:** `src/student/student.service.ts` - Líneas 135-152

```typescript
/**
 * Consulta derivada que retorna estudiantes activos junto con su carrera.
 * Se utiliza el campo isActive como filtro principal y se incluyen las relaciones
 * career y specialty mediante el mecanismo de includes de Prisma ORM.
 */
async findActiveWithCareer() {
  return this.prismaAcademic.student.findMany({
    where: {
      isActive: true,  // ← Filtro: Solo estudiantes activos
    },
    include: {
      career: {        // ← Incluye información de carrera
        include: {
          specialty: true  // ← Incluye especialidad de la carrera
        }
      }
    },
    orderBy: {
      lastName: 'asc'   // ← Ordenado alfabéticamente
    }
  });
}
```

**Endpoint:**
```http
GET http://localhost:3000/students/active-with-career
```

**Respuesta Esperada:**
```json
[
  {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "isActive": true,
    "careerId": 1,
    "career": {
      "id": 1,
      "name": "Ingeniería en Sistemas",
      "specialty": {
        "id": 1,
        "name": "Tecnología"
      }
    }
  },
  {
    "id": 2,
    "firstName": "María",
    "lastName": "García",
    "email": "maria@example.com",
    "isActive": true,
    "careerId": 1,
    "career": {
      "id": 1,
      "name": "Ingeniería en Sistemas",
      "specialty": {
        "id": 1,
        "name": "Tecnología"
      }
    }
  }
]
```

**SQL Generado (por Prisma):**
```sql
SELECT 
  s.id, s.first_name, s.last_name, s.email, 
  s.is_active, s.career_id,
  c.id, c.name, c.specialty_id,
  sp.id, sp.name
FROM students s
LEFT JOIN careers c ON s.career_id = c.id
LEFT JOIN specialties sp ON c.specialty_id = sp.id
WHERE s.is_active = true
ORDER BY s.last_name ASC
```

---

### Requisito 1.2: Obtener materias asociadas a una carrera

**Ubicación:** `src/subject/subject.service.ts` - Líneas 142-173

```typescript
/**
 * Consulta derivada que retorna las materias pertenecientes a una carrera específica.
 * Se incluyen las relaciones con career, specialty y cycle, ordenando los resultados
 * primero por número de ciclo en orden ascendente y luego alfabéticamente por nombre.
 */
async findByCareer(careerId: number) {
  const career = await this.prismaAcademic.career.findUnique({
    where: { id: careerId }
  });

  if (!career) {
    throw new NotFoundException(`Career with ID ${careerId} not found`);
  }

  return this.prismaAcademic.subject.findMany({
    where: {
      careerId  // ← Filtro por ID de carrera
    },
    include: {
      career: {
        include: {
          specialty: true
        }
      },
      cycle: true
    },
    orderBy: [
      { cycle: { number: 'asc' } },    // ← Primero por ciclo
      { name: 'asc' }                   // ← Luego alfabéticamente
    ]
  });
}
```

**Endpoint:**
```http
GET http://localhost:3000/subjects/by-career/1
```

**Respuesta Esperada:**
```json
[
  {
    "id": 1,
    "name": "Programación I",
    "credits": 4,
    "careerId": 1,
    "cycleId": 1,
    "availableQuota": 30,
    "cycle": {
      "id": 1,
      "number": 1,
      "name": "Primer Ciclo"
    },
    "career": {
      "id": 1,
      "name": "Ingeniería en Sistemas",
      "specialty": {
        "id": 1,
        "name": "Tecnología"
      }
    }
  },
  {
    "id": 2,
    "name": "Matemática Discreta",
    "credits": 3,
    "careerId": 1,
    "cycleId": 1,
    "availableQuota": 25,
    "cycle": {
      "id": 1,
      "number": 1,
      "name": "Primer Ciclo"
    },
    "career": {
      "id": 1,
      "name": "Ingeniería en Sistemas",
      "specialty": {
        "id": 1,
        "name": "Tecnología"
      }
    }
  }
]
```

---

### Requisito 1.3: Docentes que imparten más de una asignatura

**Ubicación:** `src/teacher/teacher.service.ts` - Líneas 87-121

```typescript
/**
 * Consulta derivada que identifica docentes asignados a dos o más asignaturas.
 * Se recuperan todos los docentes con sus asignaciones y se filtra a nivel de aplicación
 * aquellos cuya cantidad de relaciones teacher_subject sea superior a uno.
 */
async findTeachingMultipleSubjects() {
  const teachers = await this.prismaAcademic.teacher.findMany({
    include: {
      subjects: {  // ← Relación intermedia teacher_subjects
        include: {
          subject: {
            include: {
              career: true,
              cycle: true
            }
          }
        }
      }
    }
  });

  // Filtrado a nivel de aplicación (después de traer datos)
  const teachersWithMultipleSubjects = teachers.filter(
    (teacher) => teacher.subjects.length > 1  // ← Más de una asignatura
  );

  return teachersWithMultipleSubjects.map((teacher) => ({
    ...teacher,
    totalSubjects: teacher.subjects.length  // ← Campo calculado
  }));
}
```

**Endpoint:**
```http
GET http://localhost:3000/teachers/multiple-subjects
```

**Respuesta Esperada:**
```json
[
  {
    "id": 1,
    "firstName": "Carlos",
    "lastName": "López",
    "email": "carlos@example.com",
    "employmentType": "FULL_TIME",
    "isActive": true,
    "totalSubjects": 2,
    "subjects": [
      {
        "teacherId": 1,
        "subjectId": 1,
        "subject": {
          "id": 1,
          "name": "Programación I",
          "career": {
            "id": 1,
            "name": "Ingeniería en Sistemas"
          },
          "cycle": {
            "number": 1,
            "name": "Primer Ciclo"
          }
        }
      },
      {
        "teacherId": 1,
        "subjectId": 3,
        "subject": {
          "id": 3,
          "name": "Base de Datos",
          "career": {
            "id": 1,
            "name": "Ingeniería en Sistemas"
          },
          "cycle": {
            "number": 2,
            "name": "Segundo Ciclo"
          }
        }
      }
    ]
  }
]
```

**Nota técnica:** El filtrado se realiza en memoria (aplicación) porque Prisma no tiene un operador directo para `count(relationships) > 1`. Alternativa con mejor rendimiento sería usar SQL nativo:

```sql
SELECT t.*, COUNT(ts.id) as total_subjects
FROM teachers t
LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
GROUP BY t.id
HAVING COUNT(ts.id) > 1
```

---

### Requisito 1.4: Matrículas de estudiante en período académico

**Ubicación:** `src/enrollment/enrollment.service.ts` - Líneas 155-222

```typescript
/**
 * Consulta derivada que retorna las matrículas de un estudiante en un período específico.
 * Se incluyen las relaciones completas con subject, career, cycle y academic period
 * para proporcionar contexto completo de cada matrícula.
 */
async getStudentEnrollmentsByPeriod(
  studentId: number,
  academicPeriodId: number
) {
  const student = await this.prismaAcademic.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    throw new NotFoundException(`Student with ID ${studentId} not found`);
  }

  const period = await this.prismaAcademic.academicPeriod.findUnique({
    where: { id: academicPeriodId }
  });

  if (!period) {
    throw new NotFoundException(
      `Academic period with ID ${academicPeriodId} not found`
    );
  }

  const enrollments = await this.prismaAcademic.enrollment.findMany({
    where: {
      studentId,
      academicPeriodId
    },
    include: {
      subject: {
        include: {
          career: true,
          cycle: true
        }
      },
      academicPeriod: true
    },
    orderBy: {
      enrolledAt: 'desc'
    }
  });

  return {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email
    },
    academicPeriod: {
      id: period.id,
      name: period.name
    },
    enrollments,
    totalEnrolled: enrollments.length
  };
}
```

**Endpoint:**
```http
GET http://localhost:3000/enrollments/student/1/period/1
```

**Respuesta Esperada:**
```json
{
  "student": {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com"
  },
  "academicPeriod": {
    "id": 1,
    "name": "Período 2026-I"
  },
  "totalEnrolled": 3,
  "enrollments": [
    {
      "id": 1,
      "studentId": 1,
      "subjectId": 1,
      "academicPeriodId": 1,
      "enrolledAt": "2026-01-15T10:30:00Z",
      "subject": {
        "id": 1,
        "name": "Programación I",
        "credits": 4,
        "cycle": {
          "number": 1,
          "name": "Primer Ciclo"
        },
        "career": {
          "id": 1,
          "name": "Ingeniería en Sistemas"
        }
      }
    },
    {
      "id": 2,
      "studentId": 1,
      "subjectId": 2,
      "academicPeriodId": 1,
      "enrolledAt": "2026-01-15T10:31:00Z",
      "subject": {
        "id": 2,
        "name": "Matemática Discreta",
        "credits": 3,
        "cycle": {
          "number": 1,
          "name": "Primer Ciclo"
        },
        "career": {
          "id": 1,
          "name": "Ingeniería en Sistemas"
        }
      }
    }
  ]
}
```

---

## PARTE 2: OPERACIONES LÓGICAS

### Requisito 2.1: Estudiantes activos + carrera específica + período académico

**Ubicación:** `src/student/student.service.ts` - Líneas 155-200

```typescript
/**
 * Implementa un filtro complejo utilizando el operador lógico AND para combinar
 * tres condiciones simultáneas: estudiante activo, pertenencia a una carrera específica
 * y existencia de al menos una matrícula en el periodo académico indicado.
 */
async findActiveByCareerAndPeriod(careerId: number, periodId: number) {
  return this.prismaAcademic.student.findMany({
    where: {
      AND: [
        { isActive: true },                    // ← Condición 1: Activo
        { careerId: careerId },                // ← Condición 2: Carrera específica
        {
          enrollments: {
            some: {                            // ← Condición 3: Al menos una
              academicPeriodId: periodId       //   matrícula en el período
            }
          }
        }
      ]
    },
    include: {
      career: {
        include: {
          specialty: true
        }
      },
      enrollments: {
        where: {
          academicPeriodId: periodId
        },
        include: {
          subject: {
            include: {
              cycle: true
            }
          },
          academicPeriod: true
        }
      }
    },
    orderBy: {
      lastName: 'asc'
    }
  });
}
```

**Operadores Lógicos Aplicados:**

| Operador | Descripción | Implementación |
|----------|-------------|-----------------|
| AND | Todas las condiciones deben cumplirse | `AND: [ {...}, {...}, {...} ]` |
| some() | Al menos una relación debe cumplir | `enrollments: { some: {...} }` |

**Endpoint:**
```http
GET http://localhost:3000/students/filter?careerId=1&periodId=1
```

**SQL Equivalente:**
```sql
SELECT s.* FROM students s
WHERE 
  s.is_active = true 
  AND s.career_id = 1
  AND EXISTS (
    SELECT 1 FROM enrollments e 
    WHERE e.student_id = s.id 
    AND e.academic_period_id = 1
  )
ORDER BY s.last_name ASC
```

**Respuesta Esperada:**
```json
[
  {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "isActive": true,
    "careerId": 1,
    "career": {
      "id": 1,
      "name": "Ingeniería en Sistemas"
    },
    "enrollments": [
      {
        "id": 1,
        "subjectId": 1,
        "subject": {
          "id": 1,
          "name": "Programación I"
        }
      },
      {
        "id": 2,
        "subjectId": 2,
        "subject": {
          "id": 2,
          "name": "Matemática Discreta"
        }
      }
    ]
  }
]
```

---

### Requisito 2.2: Docentes tiempo completo AND (asignaturas OR activos) AND NOT inactivos

**Ubicación:** `src/teacher/teacher.service.ts` - Líneas 125-173

```typescript
/**
 * Implementa un filtro utilizando operadores lógicos complejos: AND, OR y NOT.
 * Se retornan docentes que satisfagan la siguiente lógica:
 * - Tipo de empleo debe ser tiempo completo (FULL_TIME) Y
 * - Al menos una de estas condiciones:
 *   - Tiene asignaturas asignadas O
 *   - Su estado NO es inactivo (equivalente a isActive = true)
 */
async findWithComplexFilter() {
  const teachers = await this.prismaAcademic.teacher.findMany({
    where: {
      AND: [
        {
          employmentType: 'FULL_TIME'  // ← AND: Tiempo completo
        },
        {
          OR: [
            {
              subjects: {
                some: {}                // ← OR: Tiene asignaturas
              }
            },
            {
              NOT: {
                isActive: false         // ← NOT: No está inactivo
              }
            }
          ]
        }
      ]
    },
    include: {
      subjects: {
        include: {
          subject: {
            include: {
              career: true,
              cycle: true
            }
          }
        }
      }
    },
    orderBy: {
      lastName: 'asc'
    }
  });

  return teachers.map((teacher) => ({
    ...teacher,
    totalSubjects: teacher.subjects.length
  }));
}
```

**Desglose de Operadores Lógicos:**

```
WHERE (
  employmentType = 'FULL_TIME'              ← AND
  AND (
    subjects.count > 0                      ← OR
    OR isActive = true                      ← OR
  )
)
```

**Tabla de Verdad Aplicada:**

| Tiempo Completo | Tiene Asignaturas | Activo | Resultado |
|-----------------|-------------------|--------|-----------|
| SÍ | SÍ | SÍ | ✅ INCLUIR |
| SÍ | SÍ | NO | ✅ INCLUIR |
| SÍ | NO | SÍ | ✅ INCLUIR |
| SÍ | NO | NO | ❌ EXCLUIR |
| NO | SÍ | SÍ | ❌ EXCLUIR |
| NO | NO | SÍ | ❌ EXCLUIR |

**Endpoint:**
```http
GET http://localhost:3000/teachers/filter-complex
```

**SQL Equivalente:**
```sql
SELECT t.* FROM teachers t
WHERE 
  t.employment_type = 'FULL_TIME'
  AND (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts 
      WHERE ts.teacher_id = t.id
    )
    OR t.is_active = true
  )
ORDER BY t.last_name ASC
```

---

## PARTE 3: CONSULTA SQL NATIVA

### Requisito 3.1: Reporte de estudiantes con total de materias

**Ubicación:** `src/enrollment/enrollment.service.ts` - Líneas 225-260

```typescript
/**
 * Implementa una consulta SQL nativa mediante $queryRaw para generar un reporte.
 * La query ejecuta un JOIN entre students, careers y enrollments, agrupando por estudiante
 * y contando el número total de matrículas. Se filtran estudiantes sin matrículas mediante
 * HAVING y se ordena descendentemente por cantidad de materias matriculadas.
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

  // Conversión de tipos BigInt a Number para compatibilidad JSON
  const results = rawResults.map((row) => ({
    studentName: row.student_name,
    careerName: row.career_name,
    totalSubjects: Number(row.total_subjects)
  }));

  return {
    report: results,
    totalStudents: results.length,
    generatedAt: new Date().toISOString()
  };
}
```

**Explicación SQL:**

```sql
-- 1. CONCAT: Combina nombre y apellido
CONCAT(s.first_name, ' ', s.last_name) as student_name

-- 2. INNER JOIN: Solo estudiantes que tienen carrera
INNER JOIN careers c ON s.career_id = c.id

-- 3. LEFT JOIN: Incluye estudiantes sin matrículas (inicialmente)
LEFT JOIN enrollments e ON s.id = e.student_id

-- 4. GROUP BY: Agrupa por estudiante (necesario para agregación)
GROUP BY s.id, s.first_name, s.last_name, c.name

-- 5. HAVING: Filtra solo estudiantes con al menos 1 matrícula
HAVING COUNT(e.id) > 0

-- 6. ORDER BY DESC: Ordena por cantidad de materias
ORDER BY total_subjects DESC
```

**Interfaz TypeScript:**
```typescript
interface EnrollmentReportRow {
  student_name: string;
  career_name: string;
  total_subjects: bigint;  // ← PostgreSQL retorna BigInt
}
```

**Endpoint:**
```http
GET http://localhost:3000/enrollments/report
```

**Respuesta Esperada:**
```json
{
  "report": [
    {
      "studentName": "Juan Pérez",
      "careerName": "Ingeniería en Sistemas",
      "totalSubjects": 5
    },
    {
      "studentName": "María García",
      "careerName": "Ingeniería en Sistemas",
      "totalSubjects": 4
    },
    {
      "studentName": "Carlos López",
      "careerName": "Ingeniería Civil",
      "totalSubjects": 3
    }
  ],
  "totalStudents": 3,
  "generatedAt": "2026-01-21T15:30:45.123Z"
}
```

**Ventajas de usar SQL Nativo:**
1. ✅ Mejor rendimiento (2-3x más rápido que ORM)
2. ✅ Operaciones agregadas complejas (`GROUP BY`, `HAVING`)
3. ✅ Control fino sobre el JOIN
4. ✅ Parametrizado automáticamente (previene SQL injection)
5. ✅ Conversión automática de tipos con TypeScript

---

## PARTE 4: TRANSACCIONES ACID

### Requisito 4.1: Transacción de Matriculación Completa

**Ubicación:** `src/enrollment/enrollment.service.ts` - Líneas 21-152

#### 4.1.1 Estructura Completa de la Transacción

```typescript
async enrollStudent(createEnrollmentDto: CreateEnrollmentDto) {
  return this.prismaAcademic.$transaction(async (prisma) => {
    // ┌─── INICIO TRANSACCIÓN ───┐
    
    // PASO 1: Validar Estudiante
    const student = await prisma.student.findUnique({
      where: { id: createEnrollmentDto.studentId }
    });
    
    if (!student) {
      throw new NotFoundException(
        `Student with ID ${createEnrollmentDto.studentId} not found`
      );
    }
    
    if (!student.isActive) {
      throw new BadRequestException(
        `Student with ID ${createEnrollmentDto.studentId} is not active`
      );
    }
    
    // PASO 2: Validar Materia
    const subject = await prisma.subject.findUnique({
      where: { id: createEnrollmentDto.subjectId }
    });
    
    if (!subject) {
      throw new NotFoundException(
        `Subject with ID ${createEnrollmentDto.subjectId} not found`
      );
    }
    
    // PASO 3: Validar Período Académico
    const academicPeriod = await prisma.academicPeriod.findUnique({
      where: { id: createEnrollmentDto.academicPeriodId }
    });
    
    if (!academicPeriod) {
      throw new NotFoundException(
        `Academic period with ID ${createEnrollmentDto.academicPeriodId} not found`
      );
    }
    
    if (!academicPeriod.isActive) {
      throw new BadRequestException(
        `Academic period "${academicPeriod.name}" is not active`
      );
    }
    
    // PASO 4: Verificar Cupos
    if (subject.availableQuota <= 0) {
      throw new BadRequestException(
        `No available quota for subject "${subject.name}"`
      );
    }
    
    // PASO 5: Validar Matrículas Duplicadas
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_subjectId_academicPeriodId: {
          studentId: createEnrollmentDto.studentId,
          subjectId: createEnrollmentDto.subjectId,
          academicPeriodId: createEnrollmentDto.academicPeriodId
        }
      }
    });
    
    if (existingEnrollment) {
      throw new ConflictException(
        `Student is already enrolled in this subject for the selected academic period`
      );
    }
    
    // PASO 6: Descontar Cupo (Operación Atómica)
    const updateResult = await prisma.subject.updateMany({
      where: {
        id: createEnrollmentDto.subjectId,
        availableQuota: { gt: 0 }  // ← Solo si hay cupos
      },
      data: {
        availableQuota: {
          decrement: 1  // ← Decremento atómico
        }
      }
    });
    
    // Verificación de concurrencia
    if (updateResult.count === 0) {
      throw new BadRequestException(
        `No available quota for subject "${subject.name}" (concurrent enrollment)`
      );
    }
    
    // PASO 7: Registrar Matrícula
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: createEnrollmentDto.studentId,
        subjectId: createEnrollmentDto.subjectId,
        academicPeriodId: createEnrollmentDto.academicPeriodId,
        enrolledAt: createEnrollmentDto.enrolledAt
          ? new Date(createEnrollmentDto.enrolledAt)
          : new Date()
      },
      include: {
        student: true,
        subject: {
          include: {
            career: true,
            cycle: true
          }
        },
        academicPeriod: true
      }
    });
    
    return {
      message: 'Student successfully enrolled',
      enrollment
    };
    
    // └─── FIN TRANSACCIÓN (COMMIT) ───┘
  });
}
```

#### 4.1.2 Endpoint

```http
POST http://localhost:3000/enrollments
Content-Type: application/json

{
  "studentId": 1,
  "subjectId": 2,
  "academicPeriodId": 1,
  "enrolledAt": "2026-01-21T10:00:00Z"
}
```

#### 4.1.3 Escenarios de Rollback Automático

**Escenario A: Estudiante No Existe**
```
1. Buscar estudiante (ID=999) → No encontrado
2. Lanzar NotFoundException
3. ROLLBACK AUTOMÁTICO → Nada se modifica
```

**Escenario B: Cupos Insuficientes**
```
1. Validaciones OK ✓
2. Intentar descontar cupo: availableQuota = 0 (ya no hay)
3. updateResult.count = 0
4. Lanzar BadRequestException
5. ROLLBACK AUTOMÁTICO → No se crea matrícula, cupo intacto
```

**Escenario C: Matrícula Duplicada**
```
1. Validaciones OK ✓
2. Verificar matrícula (estudiante-materia-período)
3. Ya existe una matrícula
4. Lanzar ConflictException
5. ROLLBACK AUTOMÁTICO → No se crea nueva matrícula
```

**Escenario D: Éxito Completo**
```
1. Todas las validaciones OK ✓
2. Cupo decrmentado: availableQuota = 29 → 28
3. Matrícula creada
4. COMMIT AUTOMÁTICO → Cambios persistidos permanentemente
```

#### 4.1.4 Eliminación de Matrícula (Transacción Inversa)

**Ubicación:** `src/enrollment/enrollment.service.ts` - Líneas 292-324

```typescript
async remove(id: number) {
  const enrollment = await this.findOne(id);

  return this.prismaAcademic.$transaction(async (prisma) => {
    // ┌─── INICIO TRANSACCIÓN INVERSA ───┐
    
    // Incrementar cupo (inverso del decremento)
    await prisma.subject.update({
      where: { id: enrollment.subjectId },
      data: {
        availableQuota: {
          increment: 1  // ← +1 cupo disponible
        }
      }
    });

    // Eliminar registro de matrícula
    return prisma.enrollment.delete({
      where: { id }
    });
    
    // └─── FIN TRANSACCIÓN (COMMIT) ───┘
  });
}
```

**Endpoint:**
```http
DELETE http://localhost:3000/enrollments/1
```

---

## CONCLUSIONES

### Síntesis de Implementación

Este proyecto demuestra la implementación completa de operaciones avanzadas de base de datos en un sistema universitario:

1. **Consultas Derivadas**: ✅ 4/4 Implementadas
   - Estudiantes activos con carrera
   - Materias por carrera
   - Docentes multidisciplinarios
   - Matrículas por período

2. **Operadores Lógicos**: ✅ 2/2 Implementados
   - Combinaciones AND/OR/NOT
   - Filtros complejos con `some()`
   - Predicados anidados

3. **SQL Nativo**: ✅ 1/1 Implementado
   - Reporte con agregaciones
   - JOINs optimizados
   - Tipado con TypeScript

4. **Transacciones ACID**: ✅ 1/1 Implementado
   - Matriculación atómica
   - Validaciones de consistencia
   - Manejo de concurrencia
   - Rollback automático

5. **Principios ACID**: ✅ Análisis Completo
   - Atomicidad: `$transaction()`
   - Consistencia: Constraints y validaciones
   - Aislamiento: Operaciones atómicas
   - Durabilidad: PostgreSQL WAL

### Rutas del Proyecto

```
Sistema_Uni_T1_m2/
├── src/
│   ├── student/
│   │   ├── student.service.ts          ← Consultas derivadas estudiantes
│   │   ├── student.controller.ts       ← Endpoints de estudiantes
│   │   └── dto/
│   │
│   ├── subject/
│   │   ├── subject.service.ts          ← Consultas materias por carrera
│   │   ├── subject.controller.ts       ← Endpoints de materias
│   │   └── dto/
│   │
│   ├── teacher/
│   │   ├── teacher.service.ts          ← Consultas docentes multidisciplinarios
│   │   ├── teacher.controller.ts       ← Endpoints de docentes
│   │   └── dto/
│   │
│   ├── enrollment/
│   │   ├── enrollment.service.ts       ← Transacciones ACID, SQL nativo
│   │   ├── enrollment.controller.ts    ← Endpoints de matrículas
│   │   └── dto/
│   │
│   ├── prisma/
│   │   ├── prisma-academic.service.ts  ← Conexión a BD académica
│   │   └── prisma.module.ts
│   │
│   └── app.module.ts                   ← Módulo principal
│
├── prisma/
│   ├── schema-academic.prisma          ← Schema con Enrollments
│   ├── seed-academic.ts                ← Datos de prueba
│   └── migrations/                     ← Versionado de BD
│
└── docs/
    └── ANALISIS_ACID_Y_DOCUMENTACION_TECNICA.md (este archivo)
```


**Instituto Sudamericano - Enero 2026**
**Paula Verdugo**

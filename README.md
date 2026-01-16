
# 🎓 Sistema Universitario - API REST

API REST desarrollada con NestJS y Prisma para la gestión de un sistema universitario, incluyendo especialidades, carreras, ciclos, materias, estudiantes y profesores.

## 📋 Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Modelo de Datos](#modelo-de-datos)
- [Endpoints](#endpoints)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Scripts Disponibles](#scripts-disponibles)

## 🚀 Tecnologías

- **NestJS 10+** - Framework de Node.js
- **Prisma 5+** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos (Neon)
- **TypeScript** - Lenguaje de programación
- **class-validator** - Validación de DTOs

## 📦 Requisitos Previos

- Node.js 18+ y npm
- Base de datos PostgreSQL (local o remota)
- Git

## ⚙️ Instalación

1. **Clonar el repositorio:**
```bash
git clone <url-repositorio>
cd project_su
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

4. **Ejecutar migraciones:**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. **Iniciar el servidor:**
```bash
npm run start:dev
```

La API estará disponible en: `http://localhost:3000`

## 🔧 Configuración

### Archivo `.env`

```properties
DATABASE_URL="postgresql://usuario:password@host:5432/database?sslmode=require"
PORT=3000
NODE_ENV=development
```

### Prisma Studio

Para visualizar y gestionar la base de datos:
```bash
npx prisma studio
```
Abre: `http://localhost:5555`

## 📁 Estructura del Proyecto

```
src/
├── prism/              # Módulo de Prisma (servicio global)
│   ├── prism.service.ts
│   └── prism.module.ts
├── user/               # Módulo de usuarios
│   ├── dto/
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── user.module.ts
├── specialty/          # Módulo de especialidades
├── career/             # Módulo de carreras
├── cycle/              # Módulo de ciclos
├── subject/            # Módulo de materias
├── teacher/            # Módulo de profesores
├── student/            # Módulo de estudiantes
├── app.module.ts
└── main.ts
```

Cada módulo contiene:
- **DTO**: Validación de datos de entrada
- **Service**: Lógica de negocio
- **Controller**: Endpoints REST
- **Module**: Configuración del módulo

## 🗄️ Modelo de Datos

### Relaciones principales:

```
Specialty (1) ──→ (N) Career
Career (1) ──→ (N) Subject
Career (1) ──→ (N) Student
Cycle (1) ──→ (N) Subject
Teacher (N) ←──→ (N) Subject (TeacherSubject)
Student (N) ←──→ (N) Subject (StudentSubject)
```

### Tablas:

- **User**: Usuarios del sistema
- **Specialty**: Especialidades (Ingeniería, Medicina, etc.)
- **Career**: Carreras universitarias
- **Cycle**: Ciclos académicos (1er ciclo, 2do ciclo, etc.)
- **Subject**: Materias/Asignaturas
- **Teacher**: Profesores
- **Student**: Estudiantes
- **TeacherSubject**: Relación profesor-materia
- **StudentSubject**: Inscripciones y calificaciones

## 🌐 Endpoints

Todos los endpoints soportan paginación con los parámetros `?page=1&limit=10`

### 👤 Users

```
POST   /users          - Crear usuario
GET    /users          - Listar usuarios (paginado)
GET    /users/:id      - Obtener usuario por ID
```

### 🎯 Specialties

```
POST   /specialties    - Crear especialidad
GET    /specialties    - Listar especialidades
GET    /specialties/:id - Obtener especialidad por ID
```

### 🎓 Careers

```
POST   /careers        - Crear carrera
GET    /careers        - Listar carreras
GET    /careers/:id    - Obtener carrera por ID
```

### 🔄 Cycles

```
POST   /cycles         - Crear ciclo
GET    /cycles         - Listar ciclos
GET    /cycles/:id     - Obtener ciclo por ID
```

### 📚 Subjects

```
POST   /subjects       - Crear materia
GET    /subjects       - Listar materias
GET    /subjects/:id   - Obtener materia por ID
```

### 👨‍🏫 Teachers

```
POST   /teachers       - Crear profesor
GET    /teachers       - Listar profesores
GET    /teachers/:id   - Obtener profesor por ID
```

### 🎓 Students

```
POST   /students       - Crear estudiante
GET    /students       - Listar estudiantes
GET    /students/:id   - Obtener estudiante por ID
```

## 📝 Ejemplos de Uso

### Crear una Especialidad

```bash
POST /specialties
Content-Type: application/json

{
  "name": "Ingeniería"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "name": "Ingeniería"
}
```

### Crear una Carrera

```bash
POST /careers
Content-Type: application/json

{
  "name": "Ingeniería de Sistemas",
  "duration": 5,
  "specialtyId": 1
}
```

**Respuesta:**
```json
{
  "id": 1,
  "name": "Ingeniería de Sistemas",
  "duration": 5,
  "specialtyId": 1,
  "specialty": {
    "id": 1,
    "name": "Ingeniería"
  }
}
```

### Crear un Estudiante

```bash
POST /students
Content-Type: application/json

{
  "firstName": "Ana",
  "lastName": "Martínez",
  "email": "ana.martinez@university.com",
  "phone": "+593987654321",
  "careerId": 1
}
```

**Respuesta:**
```json
{
  "id": 1,
  "firstName": "Ana",
  "lastName": "Martínez",
  "email": "ana.martinez@university.com",
  "phone": "+593987654321",
  "careerId": 1,
  "createdAt": "2025-10-10T18:30:00.000Z",
  "career": {
    "id": 1,
    "name": "Ingeniería de Sistemas",
    "duration": 5,
    "specialtyId": 1,
    "specialty": {
      "id": 1,
      "name": "Ingeniería"
    }
  }
}
```

### Listar con Paginación

```bash
GET /students?page=1&limit=10
```

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "firstName": "Ana",
      "lastName": "Martínez",
      "email": "ana.martinez@university.com",
      "phone": "+593987654321",
      "careerId": 1,
      "createdAt": "2025-10-10T18:30:00.000Z",
      "career": {
        "id": 1,
        "name": "Ingeniería de Sistemas",
        "duration": 5,
        "specialtyId": 1,
        "specialty": {
          "id": 1,
          "name": "Ingeniería"
        }
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run start:dev      # Inicia servidor en modo desarrollo

# Producción
npm run build          # Compila el proyecto
npm run start:prod     # Inicia servidor en producción

# Prisma
npx prisma generate    # Genera cliente Prisma
npx prisma migrate dev # Crea nueva migración
npx prisma studio      # Abre interfaz visual de BD
npx prisma db push     # Sincroniza schema sin migración

# Testing
npm run test           # Ejecuta tests
```

## ✅ Validaciones

Todas las peticiones POST son validadas automáticamente con `class-validator`:

- **Email**: Debe ser un email válido
- **Strings**: No pueden estar vacíos
- **IDs**: Deben ser números enteros
- **Relaciones**: Se verifica que existan antes de crear

### Ejemplo de error de validación:

```json
{
  "message": [
    "name should not be empty",
    "email must be an email"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## 🔒 Manejo de Errores

La API devuelve errores HTTP estándar:

- **400**: Bad Request (validación fallida)
- **404**: Not Found (recurso no encontrado)
- **500**: Internal Server Error

### Ejemplo de error 404:

```json
{
  "message": "Student with ID 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

## 📊 Orden de Creación Recomendado

Para evitar errores de relaciones, crear recursos en este orden:

1. ✅ **Specialties** (sin dependencias)
2. ✅ **Cycles** (sin dependencias)
3. ✅ **Careers** (requiere Specialty)
4. ✅ **Subjects** (requiere Career y Cycle)
5. ✅ **Teachers** (sin dependencias)
6. ✅ **Students** (requiere Career)

## 🧪 Pruebas con Postman

### Colección de Endpoints

Importa esta colección en Postman o prueba manualmente:

#### 1. Crear Especialidad
```
POST http://localhost:3000/specialties
Body: {"name": "Ingeniería"}
```

#### 2. Crear Ciclo
```
POST http://localhost:3000/cycles
Body: {"name": "1er Ciclo", "number": 1}
```

#### 3. Crear Carrera
```
POST http://localhost:3000/careers
Body: {
  "name": "Ingeniería de Sistemas",
  "duration": 5,
  "specialtyId": 1
}
```

#### 4. Crear Materia
```
POST http://localhost:3000/subjects
Body: {
  "name": "Programación I",
  "credits": 4,
  "careerId": 1,
  "cycleId": 1
}
```

#### 5. Crear Profesor
```
POST http://localhost:3000/teachers
Body: {
  "firstName": "Carlos",
  "lastName": "Rodríguez",
  "email": "carlos@university.com",
  "phone": "+593987654321"
}
```

#### 6. Crear Estudiante
```
POST http://localhost:3000/students
Body: {
  "firstName": "Ana",
  "lastName": "Martínez",
  "email": "ana@university.com",
  "careerId": 1
}
```

## 📄 Licencia

Este proyecto fue desarrollado como parte de un proyecto académico.

---

**Desarrollado por:** Daniel Padilla  
**Institución:** Instituto Sudamericano  
**Fecha:** Octubre 2025


# sistemaUniversitario
#   s i s t e m a u n i v e r s i t a r i o 1  
 #   S i s t e m a _ U n i _ T 1 _ m 2  
 
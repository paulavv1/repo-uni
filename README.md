# 🎓 Sistema Universitario - API REST

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

Backend modular y escalable para la gestión académica universitaria. Implementa arquitectura multi-base de datos, transacciones ACID para procesos críticos y consultas avanzadas con ORM y SQL nativo.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [API Endpoints](#-endpoints-principales)
- [Tecnologías](#-tecnologías)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Autores](#-autores)

---

## ✨ Características

- ✅ **Multi-base de datos**: Separación por dominios (Auth, Academic, Support)
- ✅ **Transacciones ACID**: Garantiza integridad en procesos críticos
- ✅ **Autenticación JWT**: Seguridad de endpoints y gestión de permisos
- ✅ **Validación de datos**: DTOs con class-validator
- ✅ **Documentación Swagger**: Auto-generada en `/api-docs`
- ✅ **Seeding de datos**: Datos de prueba pre-cargados
- ✅ **Colecciones Postman**: Listas para testing
- ✅ **Migraciones automáticas**: Control de versiones de BD con Prisma

---

## 🏗️ Arquitectura

El proyecto utiliza una **arquitectura Multi-DB** gestionada con Prisma, permitiendo separación de responsabilidades:

| Base de Datos | Responsabilidad |
|---|---|
| 🛡️ **Auth** | Usuarios, roles, autenticación y permisos |
| 🎓 **Academic** | Especialidades, carreras, ciclos, materias, estudiantes, docentes |
| 🔧 **Support** | Configuraciones, logs y datos del sistema |

### Estructura por Módulos

Cada módulo sigue la arquitectura estándar de NestJS:

```
src/
├── auth/                    # Autenticación y autorización
├── student/                 # Gestión de estudiantes
├── teacher/                 # Gestión de docentes
├── subject/                 # Gestión de asignaturas
├── career/                  # Carreras académicas
├── specialty/               # Especialidades
├── cycle/                   # Ciclos académicos
├── enrollment/              # Procesos de matrícula
├── user/                    # Gestión de usuarios
├── prisma/                  # Servicios de BD
└── generated/               # Clientes Prisma auto-generados
```

**Componentes de cada módulo:**
- **Controller**: Define rutas HTTP y mapea requests
- **Service**: Lógica de negocio y consultas BD
- **DTO**: Validación de datos (entrada/salida)
- **Entities**: Tipos TypeScript para transferencia de datos
- **Spec**: Tests unitarios

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/Sistema_Uni_T1_m2.git
cd Sistema_Uni_T1_m2
```

### 2. Instalar dependencias

```bash
npm install
```

---

## ⚙️ Configuración

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Bases de Datos PostgreSQL
DATABASE_AUTH_URL="postgresql://user:password@localhost:5432/db_auth"
DATABASE_ACADEMIC_URL="postgresql://user:password@localhost:5432/db_academic"
DATABASE_SUPPORT_URL="postgresql://user:password@localhost:5432/db_support"

# Seguridad JWT
JWT_SECRET="your_super_secret_key_min_32_chars"
JWT_EXPIRATION="24h"

# Configuración del servidor
NODE_ENV="development"
PORT=3000
```

### Inicializar bases de datos

**Opción 1: Todo en uno (Recomendado)**

```bash
npm run db:setup
```

Este comando ejecuta:
1. Genera clientes Prisma para las 3 bases de datos
2. Aplica todas las migraciones
3. Carga datos de prueba (seeding)

**Opción 2: Paso a paso**

```bash
# Generar clientes Prisma
npm run prisma:generate

# Aplicar migraciones
npm run migrate:dev:all

# Cargar datos de prueba
npm run db:seed:all
```

---

## 📡 Endpoints Principales

### Autenticación 🔐

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de nuevos usuarios |
| POST | `/auth/login` | Obtener JWT token |
| GET | `/auth/me` | Perfil del usuario (protegido) |
| POST | `/auth/refresh-token` | Renovar token |

### Gestión Académica 🎓

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/specialties` | Listar especialidades |
| GET | `/careers` | Listar carreras |
| GET | `/subjects` | Listar asignaturas |
| GET | `/students` | Listar estudiantes con filtros |
| GET | `/teachers` | Listar docentes |
| GET | `/cycles` | Ciclos académicos |

### Procesos Críticos ⚡

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/enrollments` | **Crear matrícula** (Transacción ACID) |
| GET | `/enrollments` | Listar matrículas |
| GET | `/enrollments/report` | Reporte con SQL nativo |
| PUT | `/enrollments/:id` | Actualizar matrícula |
| DELETE | `/enrollments/:id` | Cancelar matrícula |

> **Nota**: Los endpoints con protección requieren JWT token en el header `Authorization: Bearer <token>`

---

## 🛠️ Tecnologías

| Tecnología | Descripción |
|------------|-------------|
| **NestJS** | Framework backend TypeScript |
| **Prisma** | ORM con soporte Multi-DB |
| **PostgreSQL** | Base de datos relacional |
| **TypeScript** | Tipado estático |
| **Passport.js** | Estrategias de autenticación |
| **JWT** | Tokens seguros |
| **Class-validator** | Validación de DTOs |
| **Swagger** | Documentación automática |
| **Jest** | Testing unitario |
| **Postman** | Testing de API |

---

## 💻 Desarrollo

### Iniciar el servidor

```bash
# Modo desarrollo con watch
npm run start:dev

# Modo producción
npm run start:prod

# Modo debug
npm run start:debug
```

### Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run prisma:generate` | Generar clientes Prisma |
| `npm run migrate:dev:all` | Aplicar migraciones |
| `npm run db:seed:all` | Recargar datos de prueba |
| `npm run lint` | Validar estilo del código |
| `npm run test` | Ejecutar tests unitarios |
| `npm run test:e2e` | Ejecutar tests e2e |

### Gestión de bases de datos con Prisma Studio

Visualizar y gestionar datos en interfaz gráfica:

```bash
# Studio para BD Académica
npx prisma studio --schema=prisma/schema-academic.prisma

# Studio para BD de Autenticación
npx prisma studio --schema=prisma/schema-auth.prisma

# Studio para BD de Soporte
npx prisma studio --schema=prisma/schema-support.prisma
```

---

## 🧪 Testing

### Colecciones Postman

Se incluyen colecciones listas para importar:

1. **`postman_complete_collection.json`** - Todos los 70+ endpoints del sistema organizados por módulos
2. **`postman_students_collection.json`** - Enfoque específico en gestión de estudiantes
3. **`postman_CLASE3_COMPLETO.json`** - Colección de clase

**Pasos para usar:**

1. Importa la colección en Postman
2. Ejecuta `POST /auth/login` con credenciales de admin
3. El token se guardará automáticamente en la variable `token`
4. Usa los demás endpoints protegidos

### Tests unitarios

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:cov
```

### Tests E2E

```bash
# Ejecutar tests E2E
npm run test:e2e

# Watch mode
npm run test:e2e:watch
```

---

## 📁 Estructura del Proyecto

```
Sistema_Uni_T1_m2/
├── src/
│   ├── auth/                    # Módulo de autenticación
│   ├── student/                 # Módulo de estudiantes
│   ├── teacher/                 # Módulo de docentes
│   ├── subject/                 # Módulo de asignaturas
│   ├── career/                  # Módulo de carreras
│   ├── specialty/               # Módulo de especialidades
│   ├── cycle/                   # Módulo de ciclos
│   ├── enrollment/              # Módulo de matrículas
│   ├── user/                    # Módulo de usuarios
│   ├── prisma/                  # Servicios Prisma
│   ├── app.controller.ts        # Controlador principal
│   ├── app.module.ts            # Módulo principal
│   ├── app.service.ts           # Servicio principal
│   └── main.ts                  # Punto de entrada
├── prisma/
│   ├── schema-auth.prisma       # Schema de autenticación
│   ├── schema-academic.prisma   # Schema académico
│   ├── schema-support.prisma    # Schema de soporte
│   ├── seed-auth.ts             # Seeder autenticación
│   ├── seed-academic.ts         # Seeder académico
│   ├── seed-support.ts          # Seeder soporte
│   └── migrations/              # Migraciones de base de datos
├── test/                        # Tests E2E
├── docs/                        # Documentación adicional
├── package.json                 # Dependencias
├── tsconfig.json                # Config TypeScript
├── nest-cli.json                # Config NestJS
└── eslint.config.mjs            # Config ESLint
```

---

## 🔒 Seguridad

- **JWT**: Todos los endpoints sensibles requieren autenticación
- **Password Hashing**: Las contraseñas se almacenan hasheadas
- **Validación**: Todos los inputs se validan con DTOs
- **CORS**: Configurado para acceso seguro
- **Variables de Entorno**: Secretos no versionados

---

## 🐛 Troubleshooting

### Error: Port 3000 already in use

```bash
# Cambiar puerto en .env
PORT=3001
```

### Error: Cannot connect to database

- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en `.env`
- Verificar que las bases de datos existan

### Error: Prisma Client not found

```bash
npm run prisma:generate
```

### Error: Migraciones desincronizadas

```bash
# Resetear base de datos (solo desarrollo)
npm run db:reset
```

---

## 📚 Recursos Adicionales

- [Documentación NestJS](https://docs.nestjs.com/)
- [Documentación Prisma](https://www.prisma.io/docs/)
- [Documentación PostgreSQL](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)

---

## 👥 Autores

**Desarrollado por:** Paula Verdugo  
**Institución:** Instituto Sudamericano  
**Fecha:** 2026  
**Licencia:** Academic usage

---

## 📝 Notas

- Este proyecto es una aplicación académica de demostración
- Se utiliza para propósitos educativos
- Las credenciales de prueba se cargan automáticamente con el seeding
- Usuario admin por defecto: `admin@example.com` / `password`

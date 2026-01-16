import { config } from 'dotenv';
config({ path: '.env' });
import { PrismaClient } from './generated/client-auth';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding auth database...');

    await prisma.$connect();

    // --- Permissions ---
    const permissionsData = [
        { name: 'users:read', description: 'Leer usuarios' },
        { name: 'users:write', description: 'Crear y modificar usuarios' },
        { name: 'users:delete', description: 'Eliminar usuarios' },
        { name: 'roles:manage', description: 'Gestionar roles' },
    ];

    console.log('Validating permissions...');
    for (const p of permissionsData) {
        await prisma.permission.upsert({
            where: { name: p.name },
            update: {},
            create: p,
        });
    }

    const allPermissions = await prisma.permission.findMany();

    // --- Roles ---
    const rolesData = [
        { name: 'ADMIN', description: 'Administrador del sistema' },
        { name: 'STUDENT', description: 'Estudiante' },
        { name: 'TEACHER', description: 'Docente' },
    ];

    console.log('Validating roles...');
    for (const r of rolesData) {
        await prisma.role.upsert({
            where: { name: r.name },
            update: {},
            create: r,
        });
    }

    const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
    const studentRole = await prisma.role.findUniqueOrThrow({ where: { name: 'STUDENT' } });
    const teacherRole = await prisma.role.findUniqueOrThrow({ where: { name: 'TEACHER' } });

    // --- RolePermissions (ADMIN gets all permissions) ---
    console.log('Assigning permissions to ADMIN role...');
    const adminPermissionsData = allPermissions.map((p) => ({
        roleId: adminRole.id,
        permissionId: p.id,
    }));

    await prisma.rolePermission.createMany({
        data: adminPermissionsData,
        skipDuplicates: true,
    });

    // --- Users ---
    const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
    const hashedPasswordStudent = await bcrypt.hash('student123', 10);
    const hashedPasswordTeacher = await bcrypt.hash('teacher123', 10);

    const usersData = [
        {
            name: 'Admin User',
            email: 'admin@universidad.edu',
            username: 'admin',
            password: hashedPasswordAdmin,
            isActive: true,
            roleId: adminRole.id, // Helper for next step
        },
        {
            name: 'Juan Pérez',
            email: 'juan.perez@universidad.edu',
            username: 'jperez',
            password: hashedPasswordStudent,
            isActive: true,
            roleId: studentRole.id,
        },
        {
            name: 'María García',
            email: 'maria.garcia@universidad.edu',
            username: 'mgarcia',
            password: hashedPasswordTeacher,
            isActive: true,
            roleId: teacherRole.id,
        },
    ];

    console.log('Validating users...');
    for (const u of usersData) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { roleId, ...userData } = u;
        await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: userData,
        });
    }

    // --- UserRoles ---
    console.log('Assigning roles to users...');
    // We need to fetch users to get their IDs
    const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@universidad.edu' } });
    const studentUser = await prisma.user.findUniqueOrThrow({ where: { email: 'juan.perez@universidad.edu' } });
    const teacherUser = await prisma.user.findUniqueOrThrow({ where: { email: 'maria.garcia@universidad.edu' } });

    const userRolesData = [
        { userId: adminUser.id, roleId: adminRole.id },
        { userId: studentUser.id, roleId: studentRole.id },
        { userId: teacherUser.id, roleId: teacherRole.id },
    ];

    await prisma.userRole.createMany({
        data: userRolesData,
        skipDuplicates: true,
    });

    console.log(' Auth database seeded successfully (Idempotent)');
    console.log('Users processed:', { adminUser: adminUser.email, studentUser: studentUser.email, teacherUser: teacherUser.email });
}

main()
    .catch((e) => {
        console.error(' Error seeding auth database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

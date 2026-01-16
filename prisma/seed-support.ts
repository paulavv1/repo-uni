import { config } from 'dotenv';
config({ path: '.env' });
import { PrismaClient } from './generated/client-support';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding support database...');

    await prisma.$connect();

    await prisma.auditLog.create({
        data: {
            userId: 1,
            action: 'LOGIN',
            resource: 'AUTH',
            details: { method: 'JWT', success: true },
            ipAddress: '127.0.0.1',
        },
    });

    await prisma.auditLog.create({
        data: {
            userId: 1,
            action: 'CREATE',
            resource: 'USER',
            details: { username: 'admin', role: 'ADMIN' },
            ipAddress: '127.0.0.1',
        },
    });

    await prisma.systemLog.create({
        data: {
            level: 'INFO',
            message: 'Sistema iniciado correctamente',
            context: 'STARTUP',
        },
    });

    await prisma.systemLog.create({
        data: {
            level: 'INFO',
            message: 'Base de datos conectada',
            context: 'DATABASE',
        },
    });

    await prisma.systemLog.create({
        data: {
            level: 'WARN',
            message: 'Intento de acceso no autorizado detectado',
            context: 'SECURITY',
        },
    });

    console.log(' Support database seeded successfully');
    console.log('Created: 2 audit logs and 3 system logs');
}

main()
    .catch((e) => {
        console.error(' Error seeding support database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

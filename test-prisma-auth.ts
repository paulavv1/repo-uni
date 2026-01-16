
import { PrismaClient } from './src/generated/client-auth';

async function main() {
    console.log('Instantiating PrismaClient...');
    try {
        const prisma = new PrismaClient();
        console.log('PrismaClient instantiated successfully.');
        await prisma.$connect();
        console.log('Connected.');
        await prisma.$disconnect();
    } catch (e) {
        console.error('Error:', e);
    }
}

main();

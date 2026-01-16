const { PrismaClient } = require('@internal/prisma-client-academic');

async function main() {
    console.log('Instantiating PrismaClient...');
    try {
        const prisma = new PrismaClient();
        console.log('PrismaClient instantiated successfully.');

        console.log('Connecting...');
        await prisma.$connect();
        console.log('Connected successfully!');

        await prisma.$disconnect();
    } catch (e) {
        console.error('Error:', e);
    }
}

main();

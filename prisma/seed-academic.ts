import { config } from 'dotenv';
config({ path: '.env' });
import { PrismaClient } from './generated/client-academic';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding academic database...');

    await prisma.$connect();

    // --- Specialties ---
    const specialtiesData = [
        { name: 'Ingeniería', description: 'Especialidad de Ingeniería' },
        { name: 'Ciencias de la Salud', description: 'Especialidad de Ciencias de la Salud' },
    ];

    console.log('Validating specialties...');
    for (const s of specialtiesData) {
        await prisma.specialty.upsert({
            where: { name: s.name },
            update: {},
            create: s,
        });
    }

    const engSpecialty = await prisma.specialty.findUniqueOrThrow({ where: { name: 'Ingeniería' } });
    const healthSpecialty = await prisma.specialty.findUniqueOrThrow({ where: { name: 'Ciencias de la Salud' } });

    // --- Careers ---
    const careersData = [
        { name: 'Ingeniería de Sistemas', totalCycles: 10, durationYears: 5, specialtyId: engSpecialty.id },
        { name: 'Ingeniería Civil', totalCycles: 10, durationYears: 5, specialtyId: engSpecialty.id },
        { name: 'Medicina', totalCycles: 12, durationYears: 6, specialtyId: healthSpecialty.id },
    ];

    console.log('Validating careers...');
    for (const c of careersData) {
        await prisma.career.upsert({
            where: { name: c.name },
            update: {},
            create: c,
        });
    }

    const systemsCareer = await prisma.career.findUniqueOrThrow({ where: { name: 'Ingeniería de Sistemas' } });

    // --- Cycles ---
    console.log('Validating cycles...');
    const cyclesData = Array.from({ length: 12 }, (_, i) => {
        const cycleNum = i + 1;
        return {
            name: `Ciclo ${cycleNum}`,
            number: cycleNum,
        };
    });

    for (const c of cyclesData) {
        await prisma.cycle.upsert({
            where: { number: c.number },
            update: {},
            create: c,
        });
    }

    // Need to fetch cycles to get IDs
    const cycle1 = await prisma.cycle.findUniqueOrThrow({ where: { number: 1 } });
    const cycle2 = await prisma.cycle.findUniqueOrThrow({ where: { number: 2 } });

    // --- Subjects ---
    const subjectsData = [
        { name: 'Programación I', credits: 4, careerId: systemsCareer.id, cycleId: cycle1.id },
        { name: 'Matemática Básica', credits: 5, careerId: systemsCareer.id, cycleId: cycle1.id },
        { name: 'Base de Datos', credits: 4, careerId: systemsCareer.id, cycleId: cycle2.id },
    ];

    console.log('Validating subjects...');
    for (const s of subjectsData) {
        // Unique constraint is [careerId, cycleId, name]
        await prisma.subject.upsert({
            where: {
                careerId_cycleId_name: {
                    careerId: s.careerId,
                    cycleId: s.cycleId,
                    name: s.name,
                },
            },
            update: {},
            create: s,
        });
    }

    const subject1 = await prisma.subject.findUniqueOrThrow({
        where: {
            careerId_cycleId_name: { careerId: systemsCareer.id, cycleId: cycle1.id, name: 'Programación I' },
        },
    });

    const subject2 = await prisma.subject.findUniqueOrThrow({
        where: {
            careerId_cycleId_name: { careerId: systemsCareer.id, cycleId: cycle1.id, name: 'Matemática Básica' },
        },
    });

    // --- Students ---
    const studentsData = [
        {
            userId: 2, // From Auth DB Link
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan.perez@universidad.edu',
            phone: '987654321',
            careerId: systemsCareer.id,
        },
    ];

    console.log('Validating students...');
    for (const s of studentsData) {
        await prisma.student.upsert({
            where: { email: s.email },
            update: {},
            create: s,
        });
    }

    const student1 = await prisma.student.findUniqueOrThrow({ where: { email: 'juan.perez@universidad.edu' } });

    // --- Teachers ---
    const teachersData = [
        {
            userId: 3, // From Auth DB Link
            firstName: 'María',
            lastName: 'García',
            email: 'maria.garcia@universidad.edu',
            phone: '987654322',
        },
    ];

    console.log('Validating teachers...');
    for (const t of teachersData) {
        await prisma.teacher.upsert({
            where: { email: t.email },
            update: {},
            create: t,
        });
    }

    const teacher1 = await prisma.teacher.findUniqueOrThrow({ where: { email: 'maria.garcia@universidad.edu' } });

    // --- TeacherSubjects ---
    console.log('Assigning subjects to teachers...');
    const teacherSubjectsData = [
        { teacherId: teacher1.id, subjectId: subject1.id },
    ];

    await prisma.teacherSubject.createMany({
        data: teacherSubjectsData,
        skipDuplicates: true,
    });

    // --- StudentSubjects ---
    console.log('Assigning subjects to students...');
    const studentSubjectsData = [
        { studentId: student1.id, subjectId: subject1.id, grade: 18.5, passed: true },
        { studentId: student1.id, subjectId: subject2.id, grade: 16.0, passed: true },
    ];

    await prisma.studentSubject.createMany({
        data: studentSubjectsData,
        skipDuplicates: true,
    });

    console.log('✅ Academic database seeded successfully (Idempotent)');
    console.log('Created/Validated:', {
        specialties: specialtiesData.length,
        careers: careersData.length,
        cycles: cyclesData.length,
        subjects: subjectsData.length,
        students: studentsData.length,
        teachers: teachersData.length,
    });
}

main()
    .catch((e) => {
        console.error(' Error seeding academic database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

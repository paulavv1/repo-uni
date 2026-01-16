const fs = require('fs');
const path = require('path');

const symlinks = [
    { target: path.resolve('prisma/generated/client-auth'), link: path.resolve('node_modules/@prisma/client-auth') },
    { target: path.resolve('prisma/generated/client-academic'), link: path.resolve('node_modules/@prisma/client-academic') },
    { target: path.resolve('prisma/generated/client-support'), link: path.resolve('node_modules/@prisma/client-support') },
];

// Ensure @prisma directory exists
const prismaDir = path.resolve('node_modules/@prisma');
if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
}

symlinks.forEach(({ target, link }) => {
    // Remove existing symlink if it exists
    if (fs.existsSync(link)) {
        fs.rmSync(link, { recursive: true, force: true });
    }

    // Create symlink (junction on Windows)
    try {
        fs.symlinkSync(target, link, 'junction');
        console.log(`✓ Created symlink: ${path.basename(link)}`);
    } catch (error) {
        console.error(`✗ Failed to create symlink for ${path.basename(link)}:`, error.message);
    }
});

console.log('✓ All symlinks created');

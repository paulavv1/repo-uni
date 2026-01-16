const fs = require('fs');
const path = require('path');

const clients = [
    { dir: 'prisma/generated/client-auth', name: '@prisma/client-auth' },
    { dir: 'prisma/generated/client-academic', name: '@prisma/client-academic' },
    { dir: 'prisma/generated/client-support', name: '@prisma/client-support' },
];

clients.forEach(({ dir, name }) => {
    const packageJsonPath = path.join(dir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        packageJson.name = name;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(`✓ Updated ${name}`);
    }
});

console.log('✓ All Prisma client package names updated');

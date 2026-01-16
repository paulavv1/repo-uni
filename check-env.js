require('dotenv').config();
const fs = require('fs');

const required = [
    'DATABASE_AUTH_URL',
    'DATABASE_ACADEMIC_URL',
    'DATABASE_SUPPORT_URL'
];

console.log('Checking environment variables...');
let content = '';
let missing = false;

required.forEach(key => {
    const val = process.env[key];
    if (val) {
        console.log(`✅ ${key} is defined`);
        content += `${key}=${val}\n`;
    } else {
        console.log(`❌ ${key} is MISSING`);
        missing = true;
    }
});

if (missing) {
    process.exit(1);
} else {
    if (process.env.JWT_SECRET) content += `JWT_SECRET=${process.env.JWT_SECRET}\n`;

    fs.writeFileSync('.env.fixed', content);
    console.log('Written clean values to .env.fixed');
}

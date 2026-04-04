import { prisma } from '../src/utils/prisma';
import { hashPassword } from '../src/utils/bcrypt';

async function main() {
    const email = 'admin@relicwave.com';
    const name = 'admin';
    const password = 'admin1234';
    const app_role = 'admin';

    console.log(`Creating/updating admin account for ${email}...`);

    try {
        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                name,
                password: hashedPassword,
                app_role: app_role as any,
            },
            create: {
                email,
                name,
                password: hashedPassword,
                app_role: app_role as any,
            },
        });

        console.log(`Successfully configured admin account!`);
        console.log(`User ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.app_role}`);

    } catch (error) {
        console.error('Failed to create admin account:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();

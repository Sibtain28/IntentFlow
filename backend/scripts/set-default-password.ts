import { prisma } from '../src/utils/prisma';
import { hashPassword } from '../src/utils/bcrypt';

async function main() {
    const newPassword = 'vAbhi2678';
    console.log(`Setting default password for users without a password...`);

    try {
        const hashedPassword = await hashPassword(newPassword);

        // Find users with no password
        const users = await prisma.user.findMany({
            where: {
                password: null
            }
        });

        console.log(`Found ${users.length} users needing a password update.`);

        for (const user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            console.log(`Updated user: ${user.email}`);
        }

        console.log(`Successfully updated passwords!`);
    } catch (error) {
        console.error('Failed to update passwords:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();

/// <reference types="node" />

import { prisma } from '../src/utils/prisma';
import { hashPassword } from '../src/utils/bcrypt';

/**
 * ===============================
 * PasswordService (SRP + Encapsulation)
 * ===============================
 * - SRP: Handles only password-related operations
 * - Encapsulation: Internal logic hidden inside class
 */
class PasswordService {
  constructor(private prismaClient: typeof prisma) {} // Dependency Injection (DIP)

  /**
   * Batch Processing Pattern:
   * - Processes multiple users in a loop
   */
  async setDefaultPasswordForUsersWithoutPassword(
    newPassword: string
  ): Promise<void> {
    console.log(`Setting default password for users without a password...`);

    try {
      /**
       * Strategy-like behavior:
       * Password hashing logic can be replaced
       */
      const hashedPassword = await hashPassword(newPassword);

      /**
       * Repository Pattern (via Prisma)
       * - Abstracts DB access
       */
      const users = await this.prismaClient.user.findMany({
        where: {
          password: null,
        },
      });

      console.log(`Found ${users.length} users needing a password update.`);

      for (const user of users) {
        /**
         * Idempotent behavior:
         * Running again won’t break already updated users
         */
        await this.prismaClient.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        console.log(`Updated user: ${user.email}`);
      }

      console.log(`Successfully updated passwords!`);
    } catch (error) {
      /**
       * Defensive Programming:
       * Handle runtime errors safely
       */
      console.error('Failed to update passwords:', error);
    }
  }
}

/**
 * ===============================
 * PasswordSetupRunner (Facade Pattern)
 * ===============================
 * - Orchestrates service execution
 * - Provides single entry point
 */
class PasswordSetupRunner {
  private passwordService: PasswordService;

  constructor() {
    /**
     * Dependency Injection
     */
    this.passwordService = new PasswordService(prisma);
  }

  /**
   * Abstraction:
   * High-level workflow definition
   */
  async run(): Promise<void> {
    const newPassword = 'vAbhi2678';

    await this.passwordService.setDefaultPasswordForUsersWithoutPassword(
      newPassword
    );
  }

  /**
   * Resource cleanup → Reliability
   */
  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}

/**
 * ===============================
 * Entry Point
 * ===============================
 * - Graceful shutdown pattern
 */
const runner = new PasswordSetupRunner();

runner
  .run()
  .then(async () => {
    await runner.cleanup();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await runner.cleanup();
    process.exit(1);
  });

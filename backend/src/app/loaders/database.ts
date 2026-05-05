import { prisma } from '../../shared/utils/prisma';
import { logger } from '../../shared/utils/logger';

export const initDatabase = async (): Promise<void> => {
  await prisma.$connect();
  logger.info('Database connected via Prisma');
};



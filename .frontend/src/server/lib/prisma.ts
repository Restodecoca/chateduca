/**
 * Prisma Client Singleton
 * Inst√¢ncia √∫nica do PrismaClient para toda a aplica√ß√£o
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Conecta ao banco de dados
 */
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('‚ú?Conectado ao banco de dados');
    return prisma;
  } catch (error) {
    console.error('‚ù?Erro ao conectar ao banco de dados', error);
    throw error;
  }
}

/**
 * Desconecta do banco de dados
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('‚ú?Desconectado do banco de dados');
  } catch (error) {
    console.error('‚ù?Erro ao desconectar do banco de dados', error);
    throw error;
  }
}

export default prisma;

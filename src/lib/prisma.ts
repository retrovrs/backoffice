import { PrismaClient } from '@prisma/client'

// PrismaClient est attaché au global quand on est en développement pour éviter 
// d'épuiser les connexions de base de données pendant le hot-reloading
const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 
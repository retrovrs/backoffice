import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'stdout',
                level: 'error',
            },
            {
                emit: 'stdout',
                level: 'info',
            },
            {
                emit: 'stdout',
                level: 'warn',
            },
        ],
    })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Log SQL queries en mode développement
if (process.env.NODE_ENV !== 'production') {
    prisma.$on('query', (e) => {
        // console.log('Query: ' + e.query)
        // console.log('Params: ' + e.params)
        // console.log('Duration: ' + e.duration + 'ms')
    })
}

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 
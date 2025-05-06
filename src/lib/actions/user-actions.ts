'use server'

import prisma from '@/lib/prisma'

type UserRole = 'ADMIN' | 'EDITOR' | 'READER' | null

export async function getUserRoleById(userId: string) {
    try {
        if (!userId) {
            return {
                role: null as UserRole,
                error: 'ID utilisateur requis'
            }
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user) {
            return {
                role: null as UserRole,
                error: 'Utilisateur non trouvé'
            }
        }

        return {
            role: user.role as UserRole,
            error: null
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error)
        return {
            role: null as UserRole,
            error: 'Erreur serveur'
        }
    }
} 
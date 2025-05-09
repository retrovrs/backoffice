'use server'

import prisma from '@/lib/prisma'

type UserRole = 'ADMIN' | 'EDITOR' | 'READER' | null

export async function getUserRoleById(userId: string) {
    try {
        if (!userId) {
            return {
                role: null as UserRole,
                error: 'User ID required'
            }
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user) {
            return {
                role: null as UserRole,
                error: 'User not found'
            }
        }

        return {
            role: user.role as UserRole,
            error: null
        }
    } catch (error) {
        console.error('Error when retrieving the role:', error)
        return {
            role: null as UserRole,
            error: 'Server error'
        }
    }
} 
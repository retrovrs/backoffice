'use server'

import prisma from '@/lib/prisma'
import { UserRole } from '@/types/user-types'


export async function getUserRoleById(userId: string) {
    try {
        if (!userId) {
            return {
                role: null as UserRole | null,
                error: 'User ID required'
            }
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user) {
            return {
                role: null as UserRole | null,
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
            role: null as UserRole | null,
            error: 'Server error'
        }
    }
} 
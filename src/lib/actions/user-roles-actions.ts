'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { User, UserRole, ROLES } from '@/types/user-types'
import { requireAdmin, AuthorizationError } from '@/lib/auth-guards'


export type { User, UserRole } from '@/types/user-types'

export async function getAllUsers() {
    try {
        // Listing every backoffice account and its role is admin-only.
        await requireAdmin()

        const users = await prisma.backofficeUser.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            },
            orderBy: {
                email: 'asc'
            }
        })

        return {
            users: users as User[],
            error: null
        }
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { users: [], error: error.message }
        }
        console.error('Error retrieving users:', error)
        return {
            users: [],
            error: 'Server error while retrieving users'
        }
    }
}

export async function updateUserRole(userId: string, role: UserRole) {
    try {
        // Granting roles is the highest-privilege operation in the app: it must
        // be admin-only, otherwise any authenticated user could promote itself.
        const actor = await requireAdmin()

        if (!userId) {
            return {
                success: false,
                error: 'User ID is required'
            }
        }

        if (!ROLES.includes(role)) {
            return {
                success: false,
                error: 'Invalid role'
            }
        }

        // Check if user exists
        const existingUser = await prisma.backofficeUser.findUnique({
            where: { id: userId }
        })

        if (!existingUser) {
            return {
                success: false,
                error: 'User not found'
            }
        }

        // Prevent an admin from demoting themselves into a state where nobody
        // can administer the backoffice any more.
        if (actor.id === userId && role !== 'ADMIN') {
            const otherAdmins = await prisma.backofficeUser.count({
                where: { role: 'ADMIN', id: { not: userId } }
            })

            if (otherAdmins === 0) {
                return {
                    success: false,
                    error: 'You are the last administrator: assign another admin before changing your own role'
                }
            }
        }

        // Update user role
        const updatedUser = await prisma.backofficeUser.update({
            where: { id: userId },
            data: { role }
        })

        revalidatePath('/users/roles')

        return {
            success: true,
            user: updatedUser,
            error: null
        }
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { success: false, error: error.message }
        }
        console.error('Error updating user role:', error)
        return {
            success: false,
            error: 'Server error while updating user role'
        }
    }
} 
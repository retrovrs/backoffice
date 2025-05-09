'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { User, UserRole, ROLES } from '@/types/user-types'
import { auth } from '../auth'
import { headers } from 'next/headers'


export type { User, UserRole } from '@/types/user-types'

export async function getAllUsers() {
    try {
        const users = await prisma.user.findMany({
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
        console.error('Error retrieving users:', error)
        return {
            users: [],
            error: 'Server error while retrieving users'
        }
    }
}

export async function updateUserRole(userId: string, role: UserRole) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            return { error: 'Non authentifié' }
        }
        
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
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!existingUser) {
            return {
                success: false,
                error: 'User not found'
            }
        }

        // Update user role
        const updatedUser = await prisma.user.update({
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
        console.error('Error updating user role:', error)
        return {
            success: false,
            error: 'Server error while updating user role'
        }
    }
} 
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '../auth'
import { headers } from 'next/headers'

export type WhitelistedUser = {
    id: number
    email: string
}

export async function getWhitelistedUsers() {
    try {
        const users = await prisma.userWhiteListed.findMany({
            orderBy: {
                email: 'asc'
            }
        })

        return {
            users,
            error: null
        }
    } catch (error) {
        console.error('Error while retrieving whitelisted users:', error)
        return {
            users: [],
            error: 'Server error while retrieving users'
        }
    }
}

export async function addWhitelistedUser(email: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            return { error: 'Not authenticated' }
        }
        
        // Vérifier que l'email est valide
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return {
                success: false,
                error: 'Invalid email'
            }
        }

        // Vérifier si l'utilisateur est déjà dans la liste blanche
        const existingUser = await prisma.userWhiteListed.findFirst({
            where: { email }
        })

        if (existingUser) {
            return {
                success: false,
                error: 'This user is already in the whitelist'
            }
        }

        // Ajouter l'utilisateur à la liste blanche
        const user = await prisma.userWhiteListed.create({
            data: { email }
        })

        revalidatePath('/users/whitelist')

        return {
            success: true,
            user,
            error: null
        }
    } catch (error) {
        console.error('Error while adding user to whitelist:', error)
        return {
            success: false,
            error: 'Server error while adding user'
        }
    }
}

export async function removeWhitelistedUser(id: number) {
    try {
        await prisma.userWhiteListed.delete({
            where: { id }
        })

        revalidatePath('/users/whitelist')

        return {
            success: true,
            error: null
        }
    } catch (error) {
        console.error('Error while removing user from whitelist:', error)
        return {
            success: false,
            error: 'Server error while removing user'
        }
    }
} 
'use server'

import prisma from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'

export interface RetrovrsUser {
    id: string
    username: string | null
    email: string | null
    emailVerified: Date | null
    image: string | null
    isAdmin: boolean | null
    hasExternalBankAccount: boolean
    firstName: string | null
    lastName: string | null
    holidayMode: boolean
    accountCreatedOn: Date | null
    location: string | null
}

export interface GetUsersResult {
    users: RetrovrsUser[]
    total: number
    hasMore: boolean
    error?: string
}

export async function getRetrovrsUsers(
    page: number = 1,
    limit: number = 20
): Promise<GetUsersResult> {
    try {
        // console.log('🔍 getRetrovrsUsers called with:', { page, limit })
        // console.log('🔍 prisma instance:', !!prisma)
        // console.log('🔍 prisma.user:', !!prisma?.user)

        // Fallback: créer une nouvelle instance si la principale ne fonctionne pas
        let clientToUse = prisma
        if (!prisma?.user) {
            console.log('⚠️ Fallback: Creating new PrismaClient instance')
            clientToUse = new PrismaClient()
        }

        const offset = (page - 1) * limit

        // Compter le nombre total d'utilisateurs
        const total = await clientToUse.user.count()

        // Récupérer les utilisateurs avec pagination
        const users = await clientToUse.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                emailVerified: true,
                image: true,
                isAdmin: true,
                hasExternalBankAccount: true,
                firstName: true,
                lastName: true,
                holidayMode: true,
                accountCreatedOn: true,
                location: true
            },
            orderBy: {
                accountCreatedOn: 'desc'
            },
            skip: offset,
            take: limit
        })

        const hasMore = offset + users.length < total

        // Fermer la connexion si on a créé une nouvelle instance
        if (clientToUse !== prisma) {
            await clientToUse.$disconnect()
        }

        return {
            users,
            total,
            hasMore
        }
    } catch (error) {
        console.log('Erreur lors de la récupération des utilisateurs:', error)
        return {
            users: [],
            total: 0,
            hasMore: false,
            error: 'Erreur lors de la récupération des users'
        }
    }
}

export async function searchRetrovrsUsers(
    searchTerm: string,
    page: number = 1,
    limit: number = 20
): Promise<GetUsersResult> {
    try {
        // Fallback: créer une nouvelle instance si la principale ne fonctionne pas
        let clientToUse = prisma
        if (!prisma?.user) {
            console.log('⚠️ Fallback: Creating new PrismaClient instance for search')
            clientToUse = new PrismaClient()
        }

        const offset = (page - 1) * limit

        const whereClause = {
            OR: [
                { username: { contains: searchTerm, mode: 'insensitive' as const } },
                { email: { contains: searchTerm, mode: 'insensitive' as const } },
                { firstName: { contains: searchTerm, mode: 'insensitive' as const } },
                { lastName: { contains: searchTerm, mode: 'insensitive' as const } }
            ]
        }

        // Compter le nombre total d'utilisateurs qui correspondent à la recherche
        const total = await clientToUse.user.count({
            where: whereClause
        })

        // Récupérer les utilisateurs avec pagination et recherche
        const users = await clientToUse.user.findMany({
            where: whereClause,
            select: {
                id: true,
                username: true,
                email: true,
                emailVerified: true,
                image: true,
                isAdmin: true,
                hasExternalBankAccount: true,
                firstName: true,
                lastName: true,
                holidayMode: true,
                accountCreatedOn: true,
                location: true
            },
            orderBy: {
                accountCreatedOn: 'desc'
            },
            skip: offset,
            take: limit
        })

        const hasMore = offset + users.length < total

        // Fermer la connexion si on a créé une nouvelle instance
        if (clientToUse !== prisma) {
            await clientToUse.$disconnect()
        }

        return {
            users,
            total,
            hasMore
        }
    } catch (error) {
        console.error('Erreur lors de la recherche des utilisateurs:', error)
        return {
            users: [],
            total: 0,
            hasMore: false,
            error: 'Erreur lors de la recherche des utilisateurs'
        }
    }
}

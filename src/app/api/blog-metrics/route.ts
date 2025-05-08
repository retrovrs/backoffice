import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PostStatus } from '@prisma/client'

export async function GET() {
    try {
        // Vérification de l'authentification
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            )
        }

        // Récupération du nombre de posts par statut
        const draftCount = await prisma.seoPost.count({
            where: {
                status: PostStatus.DRAFT
            }
        })

        const publishedCount = await prisma.seoPost.count({
            where: {
                status: PostStatus.PUBLISHED
            }
        })

        return NextResponse.json({
            draftCount,
            publishedCount
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des métriques:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des métriques' },
            { status: 500 }
        )
    }
} 
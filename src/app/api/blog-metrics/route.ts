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
                { error: 'Not authenticated' },
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
        console.error('Error when loading the metrics:', error)
        return NextResponse.json(
            { error: 'Error when loading the metrics' },
            { status: 500 }
        )
    }
} 
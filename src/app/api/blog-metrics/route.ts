import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor, authErrorResponse } from '@/lib/auth-guards'
import { PostStatus } from '@prisma/client'

export async function GET() {
    try {
        // Enforce authorization server-side: the client-side role check is
        // advisory only and can be bypassed by calling this route directly.
        await requireEditor()

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
        const denied = authErrorResponse(error)
        if (denied) return denied

        console.error('Error when loading the metrics:', error)
        return NextResponse.json(
            { error: 'Error when loading the metrics' },
            { status: 500 }
        )
    }
} 
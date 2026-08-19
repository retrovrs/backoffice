import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor, authErrorResponse } from '@/lib/auth-guards'

export async function GET() {
    try {
        // Enforce authorization server-side: the client-side role check is
        // advisory only and can be bypassed by calling this route directly.
        await requireEditor()

        // Vérifier d'abord si des enregistrements existent
        const count = await prisma.seoPost.count()

        if (count === 0) {
            // Aucun enregistrement, retourner un tableau vide
            return NextResponse.json([])
        }

        // Récupération des articles de blog (uniquement s'ils existent)
        const posts = await prisma.seoPost.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                category: true
            }
        })

        return NextResponse.json(posts)
    } catch (error) {
        const denied = authErrorResponse(error)
        if (denied) return denied

        console.error('Error when loading the blog articles:', error)
        return NextResponse.json(
            { error: 'Error when loading the blog articles' },
            { status: 500 }
        )
    }
} 
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function GET(
    request: Request,
    { params }: { params: { postId: string } }
) {
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
        

        const postId = parseInt(params.postId, 10)

        if (isNaN(postId)) {
            return NextResponse.json(
                { error: 'ID d\'article invalide' },
                { status: 400 }
            )
        }

        // Récupérer uniquement l'ID et le generatedHtml de l'article
        const post = await prisma.seoPost.findUnique({
            where: {
                id: postId
            },
            select: {
                id: true,
                generatedHtml: true
            }
        })

        if (!post) {
            return NextResponse.json(
                { error: 'Article non trouvé' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            id: post.id,
            generatedHtml: post.generatedHtml || ''
        })
    } catch (error) {
        console.error('Error when loading the generated HTML:', error)
        return NextResponse.json(
            { error: 'Server error when loading the generated HTML' },
            { status: 500 }
        )
    }
} 
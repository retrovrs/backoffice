import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor, authErrorResponse } from '@/lib/auth-guards'

export async function GET(
    request: Request,
    context: { params: Promise<{ postId: string }> }
): Promise<NextResponse> {
    try {
        // Enforce authorization server-side: the client-side role check is
        // advisory only and can be bypassed by calling this route directly.
        await requireEditor()
        const params = await context.params;

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
        const denied = authErrorResponse(error)
        if (denied) return denied

        console.error('Error when loading the generated HTML:', error)
        return NextResponse.json(
            { error: 'Server error when loading the generated HTML' },
            { status: 500 }
        )
    }
} 
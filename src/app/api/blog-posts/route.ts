import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

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

        // Récupération des articles de blog
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
        console.error('Erreur lors de la récupération des articles de blog:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des articles de blog' },
            { status: 500 }
        )
    }
} 
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
        console.error('Error when loading the blog articles:', error)
        return NextResponse.json(
            { error: 'Error when loading the blog articles' },
            { status: 500 }
        )
    }
} 
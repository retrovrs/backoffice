import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

/**
 * Route API pour basculer l'état épinglé d'un article de blog
 * 
 * Cette route reçoit le slug de l'article et son nouvel état "épinglé"
 * puis met à jour uniquement ce champ dans la base de données.
 */
export async function PATCH(request: NextRequest) {
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

        // Récupérer les données de la requête
        const body = await request.json()
        const { id, pinned } = body

        // Vérifier que les paramètres requis sont fournis
        if (!id) {
            return NextResponse.json(
                { error: "L'ID est requis" },
                { status: 400 }
            )
        }

        // Vérifier que pinned est bien un booléen
        if (typeof pinned !== 'boolean') {
            return NextResponse.json(
                { error: 'Le paramètre "pinned" doit être un booléen' },
                { status: 400 }
            )
        }

        // Vérifier que l'ID est un nombre
        const postId = Number(id)
        if (isNaN(postId)) {
            return NextResponse.json(
                { error: "L'ID doit être un nombre valide" },
                { status: 400 }
            )
        }

        // Trouver l'article par son ID
        const post = await prisma.seoPost.findUnique({
            where: { id: postId }
        })

        if (!post) {
            return NextResponse.json(
                { error: 'Article non trouvé' },
                { status: 404 }
            )
        }

        // Mettre à jour uniquement le champ pinned
        const updatedPost = await prisma.seoPost.update({
            where: { id: postId },
            data: { pinned }
        })

        return NextResponse.json({
            success: true,
            pinned: updatedPost.pinned,
            message: updatedPost.pinned
                ? 'Article épinglé avec succès'
                : 'Article désépinglé avec succès'
        })
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut épinglé:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour du statut épinglé' },
            { status: 500 }
        )
    }
} 
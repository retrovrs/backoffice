import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const { userId } = params

        if (!userId) {
            return NextResponse.json(
                { error: 'L\'ID utilisateur est requis' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l\'utilisateur' },
            { status: 500 }
        )
    }
} 
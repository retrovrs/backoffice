import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
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
        
        const { userId } = params

        if (!userId) {
            return NextResponse.json(
                { error: 'The user ID is required' },
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
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error when loading the user:', error)
        return NextResponse.json(
            { error: 'Error when loading the user' },
            { status: 500 }
        )
    }
} 
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, authErrorResponse } from '@/lib/auth-guards'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        // Enforce authorization server-side: the client-side role check is
        // advisory only and can be bypassed by calling this route directly.
        await requireAdmin()
        
        const params = await context.params;

        const userId = params.userId

        if (!userId) {
            return NextResponse.json(
                { error: 'The user ID is required' },
                { status: 400 }
            )
        }

        const user = await prisma.backofficeUser.findUnique({
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
        const denied = authErrorResponse(error)
        if (denied) return denied

        console.error('Error when loading the user:', error)
        return NextResponse.json(
            { error: 'Error when loading the user' },
            { status: 500 }
        )
    }
} 
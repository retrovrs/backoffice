import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        // Vérification de l'authentification
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
                
        const { email } = await request.json()


        // Validate the email
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { isWhitelisted: false, message: 'Invalid email' },
                { status: 400 }
            )
        }

        // Check if the email is in the whitelist
        const whitelisted = await prisma.userWhiteListed.findFirst({
            where: { email }
        })

        if (!whitelisted) {
            return NextResponse.json(
                {
                    isWhitelisted: false,
                    message: 'You are not authorized to use this application. Please contact an administrator.'
                },
                { status: 200 }
            )
        }

        return NextResponse.json({ isWhitelisted: true }, { status: 200 })
    } catch (error) {
        console.error('Error while checking the whitelist:', error)
        return NextResponse.json(
            {
                isWhitelisted: false,
                message: 'An error occurred while checking the whitelist'
            },
            { status: 500 }
        )
    }
} 
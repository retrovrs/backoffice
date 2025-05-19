import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Définition du schéma de validation pour l'email
const emailSchema = z.object({
    email: z.string().email('Format d\'email invalide')
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validation avec Zod
        const result = emailSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json(
                {
                    isWhitelisted: false,
                    message: 'Email invalide',
                    errors: result.error.format()
                },
                { status: 400 }
            )
        }

        const { email } = result.data

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
        console.error('Erreur lors de la vérification de la liste blanche:', error)
        return NextResponse.json(
            {
                isWhitelisted: false,
                message: 'An error occurred while checking the whitelist'
            },
            { status: 500 }
        )
    }
} 
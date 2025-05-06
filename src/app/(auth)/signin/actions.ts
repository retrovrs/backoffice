'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { compare } from 'bcrypt'

// Schéma de validation pour le formulaire de connexion
const signinSchema = z.object({
    email: z.string().email({ message: 'Email invalide' }),
    password: z.string().min(1, { message: 'Le mot de passe est requis' })
})

export type SigninFormState = {
    errors?: {
        email?: string[]
        password?: string[]
        _form?: string[]
    }
    success?: boolean
    userId?: number
    userName?: string
}

export async function signIn(prevState: SigninFormState, formData: FormData): Promise<SigninFormState> {
    // Valider les données du formulaire
    const validatedFields = signinSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password')
    })

    // Si la validation échoue, retourner les erreurs
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            success: false
        }
    }

    const { email, password } = validatedFields.data

    try {
        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return {
                errors: {
                    _form: ['This user does not exist. Please check your email or sign up.']
                },
                success: false
            }
        }

        // Vérifier le mot de passe
        const passwordMatch = await compare(password, user.password)

        if (!passwordMatch) {
            return {
                errors: {
                    password: ['Invalid password']
                },
                success: false
            }
        }

        // Authentification réussie
        return {
            success: true,
            userId: user.id,
            userName: user.name
        }
    } catch (error) {
        console.error('Signin error:', error)
        return {
            errors: {
                _form: ['An error occurred during the login process. Please try again.']
            },
            success: false
        }
    }
} 
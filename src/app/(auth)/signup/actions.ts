'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hash } from 'bcrypt'

// Schéma de validation pour le formulaire d'inscription
const signupSchema = z.object({
    name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
    email: z.string().email({ message: 'Email invalide' }),
    password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
})

export type SignupFormState = {
    errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
        _form?: string[]
    }
    success?: boolean
}

export async function signUp(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
    // Valider les données du formulaire
    const validatedFields = signupSchema.safeParse({
        name: formData.get('name'),
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

    const { name, email, password } = validatedFields.data

    try {
        // Vérifier si l'email est dans la liste blanche
        const whitelisted = await prisma.userWhiteListed.findUnique({
            where: { email }
        })

        if (!whitelisted) {
            return {
                errors: {
                    _form: ['You are not authorized to use this application. Please contact an administrator.']
                },
                success: false
            }
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return {
                errors: {
                    email: ['This email is already in use']
                },
                success: false
            }
        }

        // Hasher le mot de passe
        const hashedPassword = await hash(password, 10)

        // Créer le nouvel utilisateur
        await prisma.user.create({
            data: {
                name,
                email,
                pseudo: name.toLowerCase().replace(/\s+/g, '-'),
                password: hashedPassword,
                role: 'READER'
            }
        })

        return {
            success: true
        }
    } catch (error) {
        console.error('Signup error:', error)
        return {
            errors: {
                _form: ['An error occurred during the registration process. Please try again.']
            },
            success: false
        }
    }
} 
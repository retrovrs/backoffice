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
    success: boolean
    msgError: string
    email: string
}

export async function signInZodValidation(formData: FormData) {
    
    const email = formData.get('email')
    const password = formData.get('password')

    if (!email || !password) {
        return {
            msgError: 'Email and password are required',
            success: false
        }
    }
    // Valider les données du formulaire
    const validatedFields = signinSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password')
    })

    // Si la validation échoue, retourner les erreurs
    if (!validatedFields.success) {
        return {
            msgError: validatedFields.error.flatten().fieldErrors,
            success: false,
            email: email
        }
    }

    return {
        success: true,
        email: email
    }
} 
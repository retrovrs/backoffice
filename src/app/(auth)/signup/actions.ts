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

export type CheckEmailResponse = {
    isWhitelisted: boolean
    message?: string
}

export async function checkEmailInWhitelist(email: string): Promise<CheckEmailResponse> {
    try {
        // Vérifier si l'email est dans la liste blanche
        const whitelisted = await prisma.userWhiteListed.findUnique({
            where: { email }
        })

        if (!whitelisted) {
            return {
                isWhitelisted: false,
                message: 'Vous n\'êtes pas autorisé à utiliser cette application. Veuillez contacter un administrateur.'
            }
        }

        return {
            isWhitelisted: true
        }
    } catch (error) {
        console.error('Vérification whitelist erreur:', error)
        return {
            isWhitelisted: false,
            message: 'Une erreur s\'est produite lors de la vérification de votre email.'
        }
    }
}

export type SignupFormState = {
    errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
        _form?: string[]
    }
    success?: boolean
    isWhitelisted?: boolean
    validatedData?: {
        name: string
        email: string
        password: string
    }
}

export async function validateSignupForm(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
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

    const { email } = validatedFields.data

    try {
        // Vérifier si l'email est dans la liste blanche
        const whitelistCheck = await checkEmailInWhitelist(email)

        if (!whitelistCheck.isWhitelisted) {
            return {
                errors: {
                    _form: [whitelistCheck.message || 'Email non autorisé']
                },
                success: false,
                isWhitelisted: false
            }
        }

        // Si tout est OK, retourner succès
        return {
            success: true,
            isWhitelisted: true
        }
    } catch (error) {
        console.error('Validation erreur:', error)
        return {
            errors: {
                _form: ['Une erreur s\'est produite. Veuillez réessayer.']
            },
            success: false
        }
    }
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
                    _form: ['Vous n\'êtes pas autorisé à utiliser cette application. Veuillez contacter un administrateur.']
                },
                success: false
            }
        }

        // Tout est OK, renvoyer les données validées pour que le client puisse appeler better-auth
        return {
            success: true,
            isWhitelisted: true,
            validatedData: {
                name,
                email,
                password
            }
        }
    } catch (error) {
        console.error('Signup error:', error)
        return {
            errors: {
                _form: ['Une erreur s\'est produite lors de l\'inscription. Veuillez réessayer.']
            },
            success: false
        }
    }
} 
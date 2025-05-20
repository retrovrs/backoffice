'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hash } from 'bcrypt'

// Schema for signup form validation
const signupSchema = z.object({
    name: z.string().min(2, { message: 'Name must contain at least 2 characters' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string()
        .min(8, { message: 'Password must contain at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' })
})

export type CheckEmailResponse = {
    isWhitelisted: boolean
    message?: string
}

export async function checkEmailInWhitelist(email: string): Promise<CheckEmailResponse> {
    try {
        // Check if email is in whitelist
        const whitelisted = await prisma.userWhiteListed.findUnique({
            where: { email }
        })

        if (!whitelisted) {
            return {
                isWhitelisted: false,
                message: 'You are not authorized to use this application. Please contact an administrator.'
            }
        }

        return {
            isWhitelisted: true
        }
    } catch (error) {
        console.error('Whitelist check error:', error)
        return {
            isWhitelisted: false,
            message: 'An error occurred while checking your email.'
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
    // Validate form data
    const validatedFields = signupSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password')
    })

    // If validation fails, return errors
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            success: false
        }
    }

    const { name, email, password } = validatedFields.data

    try {
        // Check if email is in whitelist
        const whitelistCheck = await checkEmailInWhitelist(email)

        if (!whitelistCheck.isWhitelisted) {
            return {
                errors: {
                    _form: [whitelistCheck.message || 'Email not authorized']
                },
                success: false,
                isWhitelisted: false
            }
        }

        // All good, return validated data
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
        console.error('Validation error:', error)
        return {
            errors: {
                _form: ['An error occurred. Please try again.']
            },
            success: false
        }
    }
}

// For backward compatibility - can be removed if not used elsewhere
export async function signUp(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
    return validateSignupForm(prevState, formData)
} 
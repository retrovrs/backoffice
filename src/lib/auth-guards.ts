import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { UserRole } from '@/types/user-types'

/**
 * Server-side authorization helpers.
 *
 * The client-side `useUserRole` hook drives the UI, but it can never be trusted
 * for enforcement: anyone can call a server action or API route directly. Every
 * privileged entry point must resolve the caller's role here, from the session
 * cookie and the database — never from client-supplied input.
 */

export type AuthorizedUser = {
    id: string
    email: string
    role: UserRole
}

/**
 * Resolves the caller from the session cookie and loads their current role from
 * the database. Returns null when unauthenticated or when the account no longer
 * exists (e.g. deleted while a session cookie is still live).
 */
export async function getCurrentUser(): Promise<AuthorizedUser | null> {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    const userId = session?.user?.id
    if (!userId) return null

    const user = await prisma.backofficeUser.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true }
    })

    if (!user) return null

    return {
        id: user.id,
        email: user.email,
        role: user.role as UserRole
    }
}

/** Thrown by the `require*` guards. Callers catch this to return a clean error. */
export class AuthorizationError extends Error {
    readonly status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = 'AuthorizationError'
        this.status = status
    }
}

/** Requires any authenticated backoffice user. */
export async function requireUser(): Promise<AuthorizedUser> {
    const user = await getCurrentUser()
    if (!user) {
        throw new AuthorizationError('Not authenticated', 401)
    }
    return user
}

/** Requires one of the given roles. */
export async function requireRole(...roles: UserRole[]): Promise<AuthorizedUser> {
    const user = await requireUser()
    if (!roles.includes(user.role)) {
        throw new AuthorizationError('Forbidden: insufficient privileges', 403)
    }
    return user
}

/** Requires ADMIN. */
export function requireAdmin(): Promise<AuthorizedUser> {
    return requireRole('ADMIN')
}

/** Requires ADMIN or EDITOR — the roles allowed to author blog content. */
export function requireEditor(): Promise<AuthorizedUser> {
    return requireRole('ADMIN', 'EDITOR')
}

/**
 * Normalizes a thrown guard error into the `{ success, error }` shape the server
 * actions already return, so unexpected errors are never leaked to the client.
 */
export function toActionError(error: unknown): { success: false; error: string } {
    if (error instanceof AuthorizationError) {
        return { success: false, error: error.message }
    }
    throw error
}

/**
 * Maps a guard error to a JSON response. Route handlers use this so an
 * unauthorized caller gets a proper 401/403 instead of a 500.
 */
export function authErrorResponse(error: unknown): NextResponse | null {
    if (error instanceof AuthorizationError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return null
}

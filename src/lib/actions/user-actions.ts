'use server'

import { getCurrentUser } from '@/lib/auth-guards'
import { UserRole } from '@/types/user-types'


/**
 * Returns the role of the *currently authenticated* user.
 *
 * The `userId` argument is kept for call-site compatibility but is deliberately
 * NOT trusted: the role is always resolved from the session cookie. Honouring a
 * client-supplied id here would let anyone read (and act on) another account's
 * role. A mismatch means the client is out of sync with the session, so we
 * refuse rather than answer for the wrong user.
 */
export async function getUserRoleById(userId: string) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return {
                role: null as UserRole | null,
                error: 'Not authenticated'
            }
        }

        if (userId && userId !== user.id) {
            return {
                role: null as UserRole | null,
                error: 'Forbidden'
            }
        }

        return {
            role: user.role,
            error: null
        }
    } catch (error) {
        console.error('Error when retrieving the role:', error)
        return {
            role: null as UserRole | null,
            error: 'Server error'
        }
    }
}

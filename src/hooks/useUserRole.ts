'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from '@/lib/auth-client'
import { getUserRoleById } from '@/lib/actions/user-actions'
import { UserRole } from '@/types/user-types'


export function useUserRole() {
    const session = useSession()
    const [userRole, setUserRole] = useState<UserRole | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // better-auth refetches the session on window focus, which yields a new
    // session object on every tab return. Depend on the stable user id rather
    // than that object, so consumers are not remounted on every focus.
    const userId = session.data?.user?.id ?? null
    const isSessionPending = session.isPending
    // better-auth refetches the session on focus and gives us a new object each
    // time. We must not depend on that object (it would remount consumers), but
    // we still want the role re-validated so a revoked role is caught. This
    // counter is the deliberate, identity-stable trigger for that.
    const [revalidateCount, setRevalidateCount] = useState(0)
    // Tracks whether a role has already been resolved, so a background refetch
    // never flips isLoading back on and unmounts the consumers' children.
    const hasResolvedRef = useRef(false)

    useEffect(() => {
        if (isSessionPending) return

        if (!userId) {
            setUserRole(null)
            setError(null)
            hasResolvedRef.current = true
            setIsLoading(false)
            return
        }

        let cancelled = false

        async function fetchUserRole() {
            try {
                if (!hasResolvedRef.current) {
                    setIsLoading(true)
                }
                setError(null)

                const result = await getUserRoleById(userId!)
                if (cancelled) return

                if (result.error) {
                    setError(result.error)
                } else {
                    setUserRole(result.role)
                }
            } catch (err) {
                if (cancelled) return
                console.error('Error when loading the role:', err)
                setError('Server error')
                setUserRole(null)
            } finally {
                if (!cancelled) {
                    hasResolvedRef.current = true
                    setIsLoading(false)
                }
            }
        }

        fetchUserRole()

        return () => {
            cancelled = true
        }
    }, [userId, isSessionPending, revalidateCount])

    // Re-validate the role when the tab regains focus. Mirrors better-auth's own
    // session refetch (rate-limited the same way) so a role revoked server-side
    // is picked up, without ever flipping isLoading back on.
    useEffect(() => {
        if (!userId) return

        let lastRevalidate = 0
        const REVALIDATE_RATE_LIMIT_MS = 5000

        const onVisibilityChange = () => {
            if (document.visibilityState !== 'visible') return
            const now = Date.now()
            if (now - lastRevalidate < REVALIDATE_RATE_LIMIT_MS) return
            lastRevalidate = now
            setRevalidateCount(c => c + 1)
        }

        document.addEventListener('visibilitychange', onVisibilityChange)
        return () => document.removeEventListener('visibilitychange', onVisibilityChange)
    }, [userId])

    // Dériver les valeurs booléennes à partir du rôle
    const isAdmin = userRole === 'ADMIN'
    const isEditor = userRole === 'EDITOR'
    const isAuthenticated = !!session.data?.user

    return {
        role: userRole,
        isAdmin,
        isEditor,
        isAuthenticated,
        isLoading,
        error,
        user: session.data?.user || null
    }
}

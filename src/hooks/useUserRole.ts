'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { getUserRoleById } from '@/lib/actions/user-actions'

// Correspondre à l'enum Role du schéma Prisma
type UserRole = 'ADMIN' | 'EDITOR' | 'READER' | null

export function useUserRole() {
    const session = useSession()
    const [userRole, setUserRole] = useState<UserRole>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchUserRole() {
            console.log("session", session)
            if (session.data && session.data.user) {
                try {
                    setIsLoading(true)
                    setError(null)

                    const userId = session.data.user.id
                    if (!userId) {
                        setError('ID utilisateur manquant')
                        setUserRole(null)
                        return
                    }

                    const result = await getUserRoleById(userId)
                    console.log("result", result)
                    if (result.error) {
                        setError(result.error)
                    } else {
                        setUserRole(result.role)
                    }
                } catch (err) {
                    console.error('Erreur lors de la récupération du rôle:', err)
                    setError('Erreur serveur')
                    setUserRole(null)
                } finally {
                    setIsLoading(false)
                }
            } else {
                setUserRole(null)
                setIsLoading(false)
            }
        }

        fetchUserRole()
    }, [session])

    // Dériver les valeurs booléennes à partir du rôle
    const isAdmin = userRole === 'ADMIN'
    const isReader = userRole === 'READER'
    const isAuthenticated = !!session.data?.user

    return {
        role: userRole,
        isAdmin,
        isReader,
        isAuthenticated,
        isLoading,
        error,
        user: session.data?.user || null
    }
} 
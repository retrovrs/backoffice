'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { getUserRoleById } from '@/lib/actions/user-actions'
import { UserRole } from '@/types/user-types'


export function useUserRole() {
    const session = useSession()
    const [userRole, setUserRole] = useState<UserRole | null>(null)
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
                        setError('User ID missing')
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
                    console.error('Error when loading the role:', err)
                    setError('Server error')
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
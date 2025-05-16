export type User = {
    id: string
    email: string
    name: string | null
    role: UserRole
}

export type UserRole = 'ADMIN' | 'EDITOR'

export const ROLES: UserRole[] = ['ADMIN', 'EDITOR'] 
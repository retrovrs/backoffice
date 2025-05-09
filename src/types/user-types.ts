export type User = {
    id: string
    email: string
    name: string | null
    role: 'ADMIN' | 'EDITOR' | 'READER'
}

export type UserRole = 'ADMIN' | 'EDITOR' | 'READER'

export const ROLES: UserRole[] = ['ADMIN', 'EDITOR', 'READER'] 
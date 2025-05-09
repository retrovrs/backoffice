'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getAllUsers, updateUserRole } from '@/lib/actions/user-roles-actions'
import { User, UserRole, ROLES } from '@/types/user-types'

export default function UsersRolesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingRoles, setUpdatingRoles] = useState<Record<string, boolean>>({})

  // Fonction pour charger les utilisateurs
  const loadUsers = async () => {
    setLoading(true)
    const { users, error } = await getAllUsers()
    
    if (error) {
      setError(error)
      toast.error('Error', {
        description: error
      })
    } else {
      setUsers(users)
      setError(null)
    }
    setLoading(false)
  }

  // Charger les utilisateurs au chargement de la page
  useEffect(() => {
    loadUsers()
  }, [])

  // Fonction pour mettre à jour le rôle d'un utilisateur
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRoles(prev => ({ ...prev, [userId]: true }))
    
    const { success, error } = await updateUserRole(userId, newRole)
    
    if (success) {
      toast.success('Success', {
        description: 'User role updated successfully'
      })
      
      // Met à jour l'état local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      )
    } else {
      toast.error('Error', {
        description: error || 'Error while updating user role'
      })
    }
    
    setUpdatingRoles(prev => ({ ...prev, [userId]: false }))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage User Roles</h1>
      
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || '-'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                        disabled={updatingRoles[user.id]}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 
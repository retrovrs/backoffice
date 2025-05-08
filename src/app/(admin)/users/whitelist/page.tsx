'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { getWhitelistedUsers, addWhitelistedUser, removeWhitelistedUser, type WhitelistedUser } from '@/lib/actions/whitelist-actions'

export default function WhitelistPage() {
  const [users, setUsers] = useState<WhitelistedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<WhitelistedUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Fonction pour charger les utilisateurs
  const loadUsers = async () => {
    setLoading(true)
    const { users, error } = await getWhitelistedUsers()
    
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

  // Validation de l'email
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please include "@" in the email address')
      return false
    }

    setEmailError(null)
    return true
  }

  // Gestion du changement d'email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewEmail(value)
    
    if (value) {
      validateEmail(value)
    } else {
      setEmailError(null)
    }
  }

  // Fonction pour ajouter un utilisateur
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail(newEmail)) {
      return
    }

    setAdding(true)
    const { success, error } = await addWhitelistedUser(newEmail)
    
    if (success) {
      toast.success('Success', {
        description: 'User added to the whitelist'
      })
      setNewEmail('')
      loadUsers()
    } else {
      toast.error('Error', {
        description: error || 'Error while adding the user'
      })
    }
    setAdding(false)
  }

  // Fonction pour ouvrir la modale de confirmation de suppression
  const openDeleteDialog = (user: WhitelistedUser) => {
    setUserToDelete(user)
    setDeleteDialog(true)
  }

  // Fonction pour supprimer un utilisateur
  const handleRemoveUser = async () => {
    if (!userToDelete) return
    
    setDeleting(true)
    const { success, error } = await removeWhitelistedUser(userToDelete.id)
    
    if (success) {
      toast.success('Success', {
        description: 'User deleted from the whitelist'
      })
      loadUsers()
    } else {
      toast.error('Error', {
        description: error || 'Error while deleting the user'
      })
    }
    setDeleting(false)
    setDeleteDialog(false)
    setUserToDelete(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">White List Users</h1>
      
      <div className="mb-6">
        <form ref={formRef} onSubmit={handleAddUser} className="flex flex-col gap-2">
          <div className="flex-1">
            <label htmlFor="new-email" className="block text-sm font-medium mb-1">
              Add a new user
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="new-email"
                  type="text"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={handleEmailChange}
                  disabled={adding}
                  className={emailError ? "border-red-500" : ""}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
                {emailError && (
                  <p id="email-error" className="text-sm text-red-500 mt-1">
                    {emailError}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={adding || !newEmail || !!emailError}>
                {adding ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </form>
      </div>

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
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    No user in whitelist
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(user)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm the deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user <span className="font-medium">{userToDelete?.email}</span> from the whitelist ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveUser}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
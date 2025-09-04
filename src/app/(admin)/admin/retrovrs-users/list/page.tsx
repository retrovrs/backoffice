'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ChevronLeft, ChevronRight, Users, UserCheck, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { getRetrovrsUsers, searchRetrovrsUsers, type RetrovrsUser } from '@/lib/actions/retrovrs-users-actions'

export default function RetrovrsUsersListPage() {
  const [users, setUsers] = useState<RetrovrsUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const USERS_PER_PAGE = 10

  // Fonction pour charger les utilisateurs
  const loadUsers = useCallback(async (page: number, search?: string) => {
    setLoading(true)
    setError(null)

    try {
      let result
      if (search && search.trim()) {
        result = await searchRetrovrsUsers(search.trim(), page, USERS_PER_PAGE)
        setIsSearching(true)
      } else {
        result = await getRetrovrsUsers(page, USERS_PER_PAGE)
        setIsSearching(false)
      }

      if (result.error) {
        setError(result.error)
        toast.error('Erreur', {
          description: result.error
        })
      } else {
        setUsers(result.users)
        setTotal(result.total)
        setHasMore(result.hasMore)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err)
      setError('Erreur lors du chargement des utilisateurs')
      toast.error('Erreur', {
        description: 'Erreur lors du chargement des utilisateurs'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    loadUsers(1)
  }, [loadUsers])

  // Gestion de la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadUsers(1, searchTerm)
  }

  // Réinitialiser la recherche
  const clearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1)
    loadUsers(1)
  }

  // Navigation pagination
  const goToPage = (page: number) => {
    setCurrentPage(page)
    loadUsers(page, searchTerm)
  }

  // Formatage des dates
  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  // Calcul des statistiques
  const totalPages = Math.ceil(total / USERS_PER_PAGE)
  const startIndex = (currentPage - 1) * USERS_PER_PAGE + 1
  const endIndex = Math.min(currentPage * USERS_PER_PAGE, total)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">List of RetroVrs users</h1>
          <p className="text-muted-foreground">
            Manage and view the users of the RetroVrs platform
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Users registered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.isAdmin).length}
            </div>
            <p className="text-xs text-muted-foreground">
              On this page
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.hasExternalBankAccount).length}
            </div>
            <p className="text-xs text-muted-foreground">
              With external account
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Search for users</CardTitle>
          <CardDescription>
            Search by username, email, first name or last name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for a user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              Search
            </Button>
            {isSearching && (
              <Button type="button" variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isSearching ? `Search results` : 'All users'}
              </CardTitle>
              <CardDescription>
                {total > 0 ? `Displaying ${startIndex} to ${endIndex} of ${total.toLocaleString()} users` : 'No user found'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Full name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Account created</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          {isSearching 
                            ? 'No user found'
                            : 'No user found'
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.image && (
                                <img 
                                  src={user.image} 
                                  alt="" 
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <span className="font-medium">
                                {user.username || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.email || '-'}
                              {user.emailVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.firstName || user.lastName ? 
                              `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {user.isAdmin && (
                                <Badge variant="destructive" className="text-xs">
                                  Admin
                                </Badge>
                              )}
                              {user.hasExternalBankAccount && (
                                <Badge variant="default" className="text-xs">
                                  Bank account
                                </Badge>
                              )}
                              {user.holidayMode && (
                                <Badge variant="secondary" className="text-xs">
                                  Holiday mode
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(user.accountCreatedOn)}
                          </TableCell>
                          <TableCell>
                            {user.location || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {total > USERS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    {/* Pages */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i
                        } else {
                          pageNumber = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNumber)}
                            disabled={loading}
                            className="w-10 h-10"
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={!hasMore || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryStates, parseAsString } from 'nuqs'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { useUserRole } from '@/hooks/useUserRole'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { deleteBlogPost } from '@/lib/actions/blog'

interface BlogPost {
  id: number
  title: string
  slug: string
  author: string
  series?: string | null
  createdAt: string
  updatedAt: string
  status: 'DRAFT' | 'PUBLISHED'
  pinned: boolean
  generatedHtml?: string
  category?: {
    id: number
    name: string
    description?: string
  } | null
}

const filterParsers = {
  category: parseAsString.withDefault(''),
  author: parseAsString.withDefault(''),
  series: parseAsString.withDefault(''),
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingPostId, setLoadingPostId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const { toast } = useToast()
  const { isAdmin, isEditor } = useUserRole()
  const router = useRouter()

  const [filters, setFilters] = useQueryStates(filterParsers, { shallow: true })

  useEffect(() => {
    if (isPreviewOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [isPreviewOpen])

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/blog-posts')
        if (!response.ok) throw new Error('Error when loading the blog articles')
        const data = await response.json()
        if (Array.isArray(data)) {
          setPosts(data)
        } else {
          throw new Error('Unexpected data format')
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Error when loading the blog articles')
        toast({ title: 'Error', description: 'Impossible to load the blog articles', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchPosts()
    // Run once on mount: `toast` is a stable module-level function, and the list
    // must not depend on anything that changes on window focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const uniqueCategories = useMemo(() =>
    [...new Set(posts.map(p => p.category?.name).filter(Boolean) as string[])].sort(),
    [posts]
  )
  const uniqueAuthors = useMemo(() =>
    [...new Set(posts.map(p => p.author).filter(Boolean))].sort(),
    [posts]
  )

  const filteredPosts = useMemo(() => posts.filter(post => {
    if (filters.category && post.category?.name !== filters.category) return false
    if (filters.author && post.author !== filters.author) return false
    if (filters.series && !post.series?.toLowerCase().includes(filters.series.toLowerCase())) return false
    return true
  }), [posts, filters])

  const hasActiveFilters = filters.category || filters.author || filters.series

  const handleNewPost = () => router.push('/blog-posts/new')

  const handleEditPost = (postId: number) => {
    setLoadingPostId(postId)
    if (isAdmin || isEditor) {
      setTimeout(() => router.push(`/blog-posts/edit/${postId}`), 500)
    } else {
      const fetchPostHtml = async () => {
        try {
          const response = await fetch(`/api/blog-posts/${postId}/generated-html`)
          if (!response.ok) throw new Error('Error when loading the HTML preview')
          const data = await response.json()
          const post = posts.find(p => p.id === postId)
          if (post) {
            setSelectedPost(post)
            setPreviewHtml(data.generatedHtml || '')
            setIsPreviewOpen(true)
          }
        } catch (err) {
          console.error('Error:', err)
          toast({ title: 'Error', description: 'Impossible to load the HTML preview', variant: 'destructive' })
        } finally {
          setLoadingPostId(null)
        }
      }
      fetchPostHtml()
    }
  }

  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return
    setIsDeletingPost(true)
    try {
      const result = await deleteBlogPost(postToDelete.id)
      if (result.success) {
        setPosts(prev => prev.filter(p => p.id !== postToDelete.id))
        toast({ title: 'Success', description: `Article "${postToDelete.title}" has been successfully deleted.` })
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to delete the article', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred while deleting the article', variant: 'destructive' })
    } finally {
      setIsDeletingPost(false)
      setIsDeleteModalOpen(false)
      setPostToDelete(null)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading the articles...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Blog articles</h1>
        {(isAdmin || isEditor) && (
          <Button className="bg-indigo-600 hover:bg-indigo-700 transition-colors" onClick={handleNewPost}>
            New article
          </Button>
        )}
      </div>

      {/* Filtres URL-driven via nuqs */}
      <div className="flex flex-wrap gap-3 items-end p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
          <select
            value={filters.category}
            onChange={e => setFilters({ category: e.target.value || null })}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[160px] dark:bg-slate-800 dark:border-slate-600"
          >
            <option value="">All categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Author</label>
          <select
            value={filters.author}
            onChange={e => setFilters({ author: e.target.value || null })}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[160px] dark:bg-slate-800 dark:border-slate-600"
          >
            <option value="">All authors</option>
            {uniqueAuthors.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Column / Series</label>
          <input
            type="text"
            value={filters.series}
            onChange={e => setFilters({ series: e.target.value || null })}
            placeholder="Filter by series…"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[200px] dark:bg-slate-800 dark:border-slate-600"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ category: null, author: null, series: null })}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear filters
          </Button>
        )}

        <span className="text-sm text-gray-400 self-end pb-1 ml-auto">
          {filteredPosts.length} / {posts.length} article{posts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="rounded-md border border-gray-200 overflow-hidden w-full">
        <Table>
          <TableCaption className="mt-4 mb-2 text-gray-500">List of blog articles</TableCaption>
          <TableHeader className="bg-gray-50 dark:bg-slate-800">
            <TableRow>
              <TableHead className="w-[260px] py-3 font-semibold text-gray-700 dark:text-gray-300">Title</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Author</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Series</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Creation date</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Pinned</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Category</TableHead>
              {isAdmin && (
                <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="h-24 text-center text-gray-500">
                  {hasActiveFilters ? 'No article matches the current filters' : 'No article found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post, index) => (
                <TableRow
                  key={post.id}
                  className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50'} hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors`}
                  onClick={() => handleEditPost(post.id)}
                >
                  <TableCell className="font-medium text-indigo-700 dark:text-indigo-400">
                    <div className="flex items-center gap-2">
                      {post.title}
                      {loadingPostId === post.id && <Spinner size="sm" />}
                    </div>
                  </TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>
                    {post.series ? (
                      <span className="text-sm text-gray-600 dark:text-gray-400 italic">{post.series}</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(post.createdAt)}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 border border-green-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                      {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${post.pinned ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                      {post.pinned ? 'Yes' : 'No'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.category ? (
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {post.category.name}
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        Uncategorized
                      </div>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                        onClick={() => handleDeleteClick(post)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Preview modal (non-admin) */}
      {selectedPost && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="w-screen max-w-[90vw] md:max-w-[80vw] max-h-[85vh] overflow-y-auto fixed">
            <DialogHeader>
              <DialogTitle>Preview — {selectedPost.title}</DialogTitle>
              <DialogDescription>Preview of the blog article</DialogDescription>
            </DialogHeader>
            <div className="mt-4 bg-white p-6 rounded-lg border border-gray-200 overflow-auto max-h-[60vh]">
              {previewHtml ? (
                <div className="prose lg:prose-lg mx-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <div className="text-center text-gray-500 py-12">No HTML preview available for this article</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-semibold">Delete Article</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this article? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {postToDelete && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Article to delete:</h4>
              <p className="text-sm text-gray-700 font-medium">{postToDelete.title}</p>
              <p className="text-xs text-gray-500 mt-1">By {postToDelete.author} • {formatDate(postToDelete.createdAt)}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => { setIsDeleteModalOpen(false); setPostToDelete(null) }}
              disabled={isDeletingPost}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeletingPost}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingPost ? (
                <div className="flex items-center gap-2"><Spinner size="sm" />Deleting...</div>
              ) : 'Delete Article'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

interface BlogPost {
  id: number
  title: string
  slug: string
  author: string
  createdAt: string
  updatedAt: string
  status: 'DRAFT' | 'PUBLISHED'
  published: boolean
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { isAdmin } = useUserRole()
  const router = useRouter()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/blog-posts')
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des articles')
        }
        
        const data = await response.json()
        setPosts(data)
        setIsLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('Error when loading the blog articles')
        setIsLoading(false)
        toast({
          title: 'Error',
          description: 'Impossible to load the blog articles',
          variant: 'destructive'
        })
      }
    }

    fetchPosts()
  }, [toast])

  const handleNewPost = () => {
    router.push('/admin/blog-posts/new')
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Blog articles</h1>
        {isAdmin && (
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors"
            onClick={handleNewPost}
          >
            New article
          </Button>
        )}
      </div>
      
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableCaption className="mt-4 mb-2 text-gray-500">List of blog articles</TableCaption>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[300px] py-3 font-semibold text-gray-700">Title</TableHead>
              <TableHead className="font-semibold text-gray-700">Author</TableHead>
              <TableHead className="font-semibold text-gray-700">Creation date</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  No article found
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post, index) => (
                <TableRow 
                  key={post.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <TableCell className="font-medium text-indigo-700 hover:text-indigo-800 transition-colors cursor-pointer">
                    {post.title}
                  </TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>{formatDate(post.createdAt)}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                      ${post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 border border-green-200' : 
                        post.status === 'DRAFT' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 
                        'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                      {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mr-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      onClick={() => router.push(`/admin/blog-posts/edit/${post.id}`)}
                    >
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 
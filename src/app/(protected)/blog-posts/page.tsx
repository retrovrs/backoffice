'use client'

import { useState, useEffect } from 'react'
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

interface BlogPost {
  id: string
  title: string
  slug: string
  author: string
  publishDate: string
  status: 'draft' | 'published' | 'archived'
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Loading data simulation
  // In a real application, you would use useEffect to load data from an API
  useEffect(() => {
    // API request simulation
    setTimeout(() => {
      try {
        // Mock data for demonstration
        const mockPosts: BlogPost[] = [
          {
            id: '1',
            title: 'How to optimize your SEO in 2023',
            slug: 'optimize-seo-2023',
            author: 'John Smith',
            publishDate: '2023-05-15T10:00:00Z',
            status: 'published'
          },
          {
            id: '2',
            title: 'Best practices for local SEO',
            slug: 'best-practices-local-seo',
            author: 'Mary Johnson',
            publishDate: '2023-06-22T14:30:00Z',
            status: 'published'
          },
          {
            id: '3',
            title: 'Keyword analysis for beginners',
            slug: 'keyword-analysis-beginners',
            author: 'Paul Wilson',
            publishDate: '2023-07-10T09:15:00Z', 
            status: 'draft'
          }
        ]
        
        setPosts(mockPosts)
        setIsLoading(false)
      } catch (err) {
        setError('Error loading blog posts')
        setIsLoading(false)
        toast({
          title: 'Error',
          description: 'Unable to load blog posts',
          variant: 'destructive'
        })
      }
    }, 1000)
  }, [toast])

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading blog posts...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700 transition-colors">New Post</Button>
      </div>
      
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableCaption className="mt-4 mb-2 text-gray-500">List of blog posts</TableCaption>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[300px] py-3 font-semibold text-gray-700">Title</TableHead>
              <TableHead className="font-semibold text-gray-700">Author</TableHead>
              <TableHead className="font-semibold text-gray-700">Publication Date</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  No blog posts found
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
                  <TableCell>{formatDate(post.publishDate)}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                      ${post.status === 'published' ? 'bg-green-100 text-green-800 border border-green-200' : 
                        post.status === 'draft' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 
                        'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                      {post.status === 'published' ? 'Published' : 
                       post.status === 'draft' ? 'Draft' : 'Archived'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
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
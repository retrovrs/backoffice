'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { getBlogPost, updateBlogPost } from '@/lib/actions/blog'
import { BlogPostFormValues } from '@/types/blog'
import BlogPostForm from '@/components/blog/BlogPostForm'

interface BlogPostEditorProtectedProps {
  id: string
}

export default function BlogPostEditorProtected({ id }: BlogPostEditorProtectedProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialData, setInitialData] = useState<Partial<BlogPostFormValues> & { id?: number }>({})

  // Load the blog post data
  useEffect(() => {
    async function loadBlogPost() {
      try {
        const postId = parseInt(id)
        if (isNaN(postId)) {
          toast({
            title: 'Error',
            description: 'Invalid blog post ID',
            variant: 'destructive'
          })
          router.push('/blog-posts')
          return
        }

        const result = await getBlogPost(postId)
        
        if (result.error) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive'
          })
          router.push('/blog-posts')
          return
        }

        if (result.post) {
          // Format the data for the form
          console.log('Blog post data loaded:', {
            id: postId,
            tags: result.post.tags,
            metaKeywords: result.post.metaKeywords
          });
          
          setInitialData({
            // Ajout de l'ID pour l'épinglage et autres opérations
            id: postId,
            title: result.post.title,
            slug: result.post.slug,
            excerpt: result.post.metaDescription,
            status: result.post.status === 'PUBLISHED' ? 'published' : 'draft',
            category: result.post.category.name,
            pinned: result.post.pinned || false, // S'assurer que pinned est toujours inclus
            author: result.post.author,
            authorLink: result.post.authorLink || '',
            publishDate: result.post.createdAt ? new Date(result.post.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            introText: result.post.excerpt || '',
            mainImageUrl: result.post.mainImageUrl || '',
            mainImageAlt: result.post.mainImageAlt || '',
            mainImageCaption: result.post.mainImageCaption || '',
            content: result.post.content,
            structuredContent: result.post.structuredContent,
            tags: result.post.tags || ''
          })
          
          console.log('initialData prepared with tags:', result.post.tags);
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading the blog post:', error)
        toast({
          title: 'Error',
          description: 'Unable to load the blog post',
          variant: 'destructive'
        })
        router.push('/blog-posts')
      }
    }
    
    loadBlogPost()
  }, [id, router, toast])

  const handleSubmit = async (formData: BlogPostFormValues) => {
    setIsSubmitting(true)

    try {
      const postId = parseInt(id)
      const result = await updateBlogPost(postId, formData)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: 'Success',
        description: 'Blog post updated successfully',
      })
      
      router.push('/blog-posts')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update the blog post',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading blog post...</div>
  }

  return (
    <BlogPostForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      mode="edit"
    />
  )
} 
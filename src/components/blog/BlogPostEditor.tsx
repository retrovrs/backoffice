'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { getBlogPost, updateBlogPost } from '@/lib/actions/blog'
import { BlogPostFormValues } from '@/types/blog'
import BlogPostForm from '@/components/blog/BlogPostForm'

interface BlogPostEditorProps {
  id: string
}

export default function BlogPostEditor({ id }: BlogPostEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialData, setInitialData] = useState<Partial<BlogPostFormValues>>({})

  // Charger les données de l'article
  useEffect(() => {
    async function loadBlogPost() {
      try {
        const postId = parseInt(id)
        if (isNaN(postId)) {
          toast({
            title: 'Error',
            description: 'Invalid article ID',
            variant: 'destructive'
          })
          router.push('/admin/blog-posts')
          return
        }

        const result = await getBlogPost(postId)
        
        if (result.error) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive'
          })
          router.push('/admin/blog-posts')
          return
        }

        if (result.post) {
          // Formater les données pour le formulaire
          setInitialData({
            title: result.post.title,
            slug: result.post.slug,
            excerpt: result.post.metaDescription,
            status: result.post.status === 'PUBLISHED' ? 'published' : 'draft',
            category: result.post.category.name,
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
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error when loading the article:', error)
        toast({
          title: 'Error',
          description: 'Impossible to load the article',
          variant: 'destructive'
        })
        router.push('/admin/blog-posts')
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
        description: 'Article updated successfully',
      })
      
      router.push('/admin/blog-posts')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update the article',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading the article...</div>
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
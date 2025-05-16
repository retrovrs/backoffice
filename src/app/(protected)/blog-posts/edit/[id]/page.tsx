'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { getBlogPost, updateBlogPost } from '@/lib/actions/blog'
import { BlogPostFormValues } from '@/types/blog'
import BlogPostForm from '@/components/blog/BlogPostForm'

interface PageProps {
  params: {
    id: string
  }
}

export default function EditBlogPostPage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialData, setInitialData] = useState<Partial<BlogPostFormValues>>({})

  // Charger les données de l'article
  useEffect(() => {
    async function loadBlogPost() {
      try {
        const id = parseInt(params.id)
        if (isNaN(id)) {
          toast({
            title: 'Erreur',
            description: 'ID d\'article invalide',
            variant: 'destructive'
          })
          router.push('/blog-posts')
          return
        }

        const result = await getBlogPost(id)
        
        if (result.error) {
          toast({
            title: 'Erreur',
            description: result.error,
            variant: 'destructive'
          })
          router.push('/blog-posts')
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
            tags: result.post.metaKeywords ? result.post.metaKeywords.join(', ') : ''
          })
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement de l\'article:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger l\'article',
          variant: 'destructive'
        })
        router.push('/blog-posts')
      }
    }
    
    loadBlogPost()
  }, [params.id, router, toast])

  const handleSubmit = async (formData: BlogPostFormValues) => {
    setIsSubmitting(true)

    try {
      const id = parseInt(params.id)
      const result = await updateBlogPost(id, formData)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: 'Succès',
        description: 'Article mis à jour avec succès',
      })
      
      router.push('/blog-posts')
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la mise à jour de l\'article',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Chargement de l'article...</div>
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
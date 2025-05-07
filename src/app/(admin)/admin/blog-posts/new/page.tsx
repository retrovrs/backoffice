'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { createBlogPost } from '@/app/actions/blog'
import { BlogPostFormValues } from '@/types/blog'
import BlogPostForm from '@/components/blog/BlogPostForm'

export default function NewBlogPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: BlogPostFormValues) => {
    setIsSubmitting(true)

    try {
      const result = await createBlogPost(formData)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: 'Succès',
        description: 'Article créé avec succès',
      })
      
      router.push('/blog-posts')
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la création de l\'article',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BlogPostForm
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      mode="create"
    />
  )
} 
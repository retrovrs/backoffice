'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { BlogPostSEOHelper } from '@/components/blog/BlogPostSEOHelper'
import { BlogPostSEOAssistant } from '@/components/blog/BlogPostSEOAssistant'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function NewBlogPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Méta-données
    title: '',
    slug: '',
    excerpt: '',
    status: 'draft',
    category: 'blog',
    
    // Données header
    author: '',
    publishDate: new Date().toISOString().split('T')[0],
    
    // Données introduction
    introText: '',
    mainImageUrl: '',
    mainImageAlt: '',
    
    // Contenu principal
    content: ''
  })
  const [shouldAutoUpdateSlug, setShouldAutoUpdateSlug] = useState(true)

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
  }

  useEffect(() => {
    if (shouldAutoUpdateSlug && formData.title) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.title)
      }))
    }
  }, [formData.title, shouldAutoUpdateSlug])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    
    // When changing slug manually, disable auto-updates
    if (name === 'slug' && value !== generateSlug(formData.title)) {
      setShouldAutoUpdateSlug(false)
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Here you would typically make an API call to create the post
      // For demonstration, we'll simulate a successful creation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: 'Success',
        description: 'Blog post created successfully',
      })
      
      router.push('/blog-posts')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create blog post',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Create New Blog Post</h1>
          <BlogPostSEOHelper />
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/blog-posts')}
          className="border-gray-300"
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg border border-gray-200">
        <Accordion type="multiple" defaultValue={['meta', 'header', 'intro', 'content']} className="space-y-4">
          {/* Méta-données de l'article */}
          <AccordionItem value="meta" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Méta-données de l'article</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de l'article</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Entrez le titre de l'article"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="titre-de-larticle"
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setShouldAutoUpdateSlug(true)
                        setFormData(prev => ({
                          ...prev,
                          slug: generateSlug(prev.title)
                        }))
                      }}
                      className="mb-0.5"
                      variant="outline"
                      disabled={!formData.title}
                    >
                      Générer depuis le titre
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {shouldAutoUpdateSlug ? 
                      'Le slug se mettra à jour automatiquement en fonction du titre. Modifiez-le manuellement pour désactiver cette mise à jour.' : 
                      'Mise à jour automatique désactivée. Cliquez sur "Générer depuis le titre" pour réactiver.'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Extrait (meta description)</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    placeholder="Résumé court de l'article (150-160 caractères recommandés)"
                    className="min-h-[80px]"
                    required
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {formData.excerpt.length} / 160 caractères
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* En-tête de l'article */}
          <AccordionItem value="header" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">En-tête de l'article</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Auteur</Label>
                  <Input
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    placeholder="Nom de l'auteur"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishDate">Date de publication</Label>
                  <Input
                    id="publishDate"
                    name="publishDate"
                    type="date"
                    value={formData.publishDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Introduction et image principale */}
          <AccordionItem value="intro" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Introduction et image principale</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="introText">Texte d'introduction</Label>
                  <Textarea
                    id="introText"
                    name="introText"
                    value={formData.introText}
                    onChange={handleChange}
                    placeholder="Paragraphe d'introduction qui capte l'attention et résume l'article"
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mainImageUrl">URL de l'image principale</Label>
                    <Input
                      id="mainImageUrl"
                      name="mainImageUrl"
                      value={formData.mainImageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/images/mon-image.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mainImageAlt">Texte alternatif de l'image</Label>
                    <Input
                      id="mainImageAlt"
                      name="mainImageAlt"
                      value={formData.mainImageAlt}
                      onChange={handleChange}
                      placeholder="Description détaillée de l'image pour l'accessibilité et le SEO"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contenu principal */}
          <AccordionItem value="content" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Contenu principal</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-4">
                <Label htmlFor="content">Contenu de l'article</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Rédigez le contenu de votre article ici..."
                  className="min-h-[300px]"
                  required
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/blog-posts')}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <BlogPostSEOAssistant formData={formData} disabled={isSubmitting} />
          <Button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création...' : 'Créer l\'article'}
          </Button>
        </div>
      </form>
    </div>
  )
} 
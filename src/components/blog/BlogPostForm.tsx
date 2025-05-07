'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { BlogPostSEOHelper } from '@/components/blog/BlogPostSEOHelper'
import { BlogPostSEOAssistant } from '@/components/blog/BlogPostSEOAssistant'
import { BlogContentEditor } from '@/components/blog/BlogContentEditor'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getCategories } from '@/app/actions/category'
import { BlogPostFormValues } from '@/types/blog'

interface BlogPostFormProps {
  initialData?: Partial<BlogPostFormValues>
  onSubmit: (formData: BlogPostFormValues) => Promise<void>
  isSubmitting: boolean
  mode: 'create' | 'edit'
}

export default function BlogPostForm({ 
  initialData = {}, 
  onSubmit, 
  isSubmitting, 
  mode 
}: BlogPostFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<{ id: number; name: string; description: string | null }[]>([])
  const [formData, setFormData] = useState<BlogPostFormValues>({
    // Méta-données
    title: initialData.title || '',
    slug: initialData.slug || '',
    excerpt: initialData.excerpt || '',
    status: initialData.status || 'draft',
    category: initialData.category || 'blog',
    
    // Données header
    author: initialData.author || '',
    authorLink: initialData.authorLink || '',
    publishDate: initialData.publishDate || new Date().toISOString().split('T')[0],
    
    // Données introduction
    introText: initialData.introText || '',
    mainImageUrl: initialData.mainImageUrl || '',
    mainImageAlt: initialData.mainImageAlt || '',
    mainImageCaption: initialData.mainImageCaption || '',
    
    // Contenu principal
    content: initialData.content || '',
    structuredContent: initialData.structuredContent,
    
    // Tags
    tags: initialData.tags || ''
  })
  const [shouldAutoUpdateSlug, setShouldAutoUpdateSlug] = useState(mode === 'create')

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
  }

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getCategories()
        if (result.success && result.categories) {
          setCategories(result.categories)
        }
      } catch (error) {
        console.error('Error when loading the categories:', error)
      }
    }
    
    loadCategories()
  }, [])

  // Auto-update slug based on title if enabled
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

  // Gérer les changements du contenu structuré
  const handleContentChange = useCallback((jsonContent: string, rawContent: string) => {
    try {
      const structuredContent = JSON.parse(jsonContent);
      
      setFormData(prev => ({
        ...prev,
        content: rawContent,
        structuredContent: structuredContent
      }));
      
      // Pour diagnostic - vérifier le contenu HTML généré
      console.log('Content HTML généré:', rawContent);
      
    } catch (error) {
      console.error('Erreur lors du parsing du contenu JSON:', error);
      // En cas d'erreur, mettre à jour uniquement le contenu brut
      setFormData(prev => ({
        ...prev,
        content: rawContent
      }));
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate category
    if (!formData.category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive"
      })
      return
    }
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error when submitting form:', error)
    }
  }

  const pageTitle = mode === 'create' ? 'Create a new article' : 'Edit the article'
  const submitButtonText = isSubmitting 
    ? 'Saving...' 
    : (mode === 'create' ? 'Save the article' : 'Save the modifications')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
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

      <form onSubmit={handleFormSubmit} className="space-y-8 bg-white p-6 rounded-lg border border-gray-200">
        <Accordion type="multiple" defaultValue={['meta', 'category', 'header', 'intro', 'content', 'tags']} className="space-y-4">
          {/* Méta-données de l'article */}
          <AccordionItem value="meta" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Article meta-data</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Article title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter the article title"
                    required
                    onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                      e.target.setCustomValidity('Please fill in this field')
                    }
                    onInput={(e: React.FormEvent<HTMLInputElement>) => 
                      e.currentTarget.setCustomValidity('')
                    }
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
                        placeholder="article-title"
                        required={!shouldAutoUpdateSlug}
                        onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                          e.target.setCustomValidity(shouldAutoUpdateSlug ? '' : 'Please fill in this field')
                        }
                        onInput={(e: React.FormEvent<HTMLInputElement>) => 
                          e.currentTarget.setCustomValidity('')
                        }
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
                      Generate from title
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {shouldAutoUpdateSlug ? 
                      'The slug will be updated automatically based on the title. Modify it manually to disable automatic updates.' : 
                      'Automatic updates disabled. Click "Generate from title" to reactivate.'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Extrait (meta description)</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    placeholder="Short summary of the article (150-160 characters recommended)"
                    className="min-h-[80px]"
                    required
                    onInvalid={(e: React.InvalidEvent<HTMLTextAreaElement>) => 
                      e.target.setCustomValidity('Please fill in this field')
                    }
                    onInput={(e: React.FormEvent<HTMLTextAreaElement>) => 
                      e.currentTarget.setCustomValidity('')
                    }
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {formData.excerpt.length} / 160 characters
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Category */}
          <AccordionItem value="category" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Category</AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <div className="flex items-center mb-4">
                  <Label className="text-base font-medium">Select a category</Label>
                  <span className="text-red-500 ml-1">*</span>
                </div>
                <RadioGroup 
                  value={formData.category} 
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <div key={category.id} className="flex items-start space-x-2">
                        <RadioGroupItem 
                          value={category.name} 
                          id={`category-${category.id}`} 
                          className="mt-1" 
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor={`category-${category.id}`} className="font-medium">
                            {category.name}
                          </Label>
                          {category.description && (
                            <p className="text-sm text-gray-500">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-4 text-center">
                      <p className="text-gray-500">Loading categories...</p>
                      <div className="mt-2">
                        <Label htmlFor="manual-category" className="sr-only">Category name</Label>
                        <Input
                          id="manual-category"
                          type="text"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          placeholder="Enter a category name"
                          className="max-w-md mx-auto"
                          required
                          onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                            e.target.setCustomValidity('Please enter a category name')
                          }
                          onInput={(e: React.FormEvent<HTMLInputElement>) => 
                            e.currentTarget.setCustomValidity('')
                          }
                        />
                      </div>
                    </div>
                  )}
                </RadioGroup>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Tags */}
          <AccordionItem value="tags" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Tags</AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor="tags">Article tags</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Enter the tags separated by commas (ex: technology, business, design)"
                  />
                  <p className="text-xs text-gray-500">
                    Tags help to categorize your article and improve its visibility
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* En-tête de l'article */}
          <AccordionItem value="header" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Article header</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    placeholder="Author name"
                    required
                    onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                      e.target.setCustomValidity('Please fill in this field')
                    }
                    onInput={(e: React.FormEvent<HTMLInputElement>) => 
                      e.currentTarget.setCustomValidity('')
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorLink">Author link (URL)</Label>
                  <Input
                    id="authorLink"
                    name="authorLink"
                    type="url"
                    value={formData.authorLink}
                    onChange={handleChange}
                    placeholder="https://example.com/author-profile"
                    onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                      e.target.setCustomValidity('Please enter a valid URL (or leave empty)')
                    }
                    onInput={(e: React.FormEvent<HTMLInputElement>) => 
                      e.currentTarget.setCustomValidity('')
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Optional URL to the author's profile or website
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishDate">Publication date</Label>
                  <Input
                    id="publishDate"
                    name="publishDate"
                    type="date"
                    value={formData.publishDate}
                    onChange={handleChange}
                    required
                    onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                      e.target.setCustomValidity('Please fill in this field')
                    }
                    onInput={(e: React.FormEvent<HTMLInputElement>) => 
                      e.currentTarget.setCustomValidity('')
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Introduction et image principale */}
          <AccordionItem value="intro" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Main image and introduction</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="introText">Introduction text</Label>
                  <Textarea
                    id="introText"
                    name="introText"
                    value={formData.introText}
                    onChange={handleChange}
                    placeholder="Introduction paragraph that captures attention and summarizes the article"
                    className="min-h-[100px]"
                    required
                    onInvalid={(e: React.InvalidEvent<HTMLTextAreaElement>) => 
                      e.target.setCustomValidity('Please fill in this field')
                    }
                    onInput={(e: React.FormEvent<HTMLTextAreaElement>) => 
                      e.currentTarget.setCustomValidity('')
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mainImageUrl">Main image URL</Label>
                    <Input
                      id="mainImageUrl"
                      name="mainImageUrl"
                      value={formData.mainImageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/images/mon-image.jpg"
                      required
                      onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                        e.target.setCustomValidity('Please enter an image URL')
                      }
                      onInput={(e: React.FormEvent<HTMLInputElement>) => 
                        e.currentTarget.setCustomValidity('')
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mainImageAlt">Alternative text</Label>
                    <Input
                      id="mainImageAlt"
                      name="mainImageAlt"
                      value={formData.mainImageAlt}
                      onChange={handleChange}
                      placeholder="Detailed description of the image for accessibility and SEO"
                      required
                      onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                        e.target.setCustomValidity('Please enter an alternative text for the image')
                      }
                      onInput={(e: React.FormEvent<HTMLInputElement>) => 
                        e.currentTarget.setCustomValidity('')
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mainImageCaption">Image caption</Label>
                    <Input
                      id="mainImageCaption"
                      name="mainImageCaption"
                      value={formData.mainImageCaption}
                      onChange={handleChange}
                      placeholder="Image caption that will appear below the image"
                      required
                      onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                        e.target.setCustomValidity('Please enter a caption for the image')
                      }
                      onInput={(e: React.FormEvent<HTMLInputElement>) => 
                        e.currentTarget.setCustomValidity('')
                      }
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contenu principal */}
          <AccordionItem value="content" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Main content</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-4">
                <Label htmlFor="content">Main content</Label>
                <BlogContentEditor
                  initialContent={formData.structuredContent ? JSON.stringify(formData.structuredContent) : formData.content}
                  onChange={handleContentChange}
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
            Cancel
          </Button>
          <BlogPostSEOAssistant formData={formData} disabled={isSubmitting} />
          <Button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors"
            disabled={isSubmitting}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  )
} 
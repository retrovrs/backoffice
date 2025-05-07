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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createBlogPost } from '@/app/actions/blog'
import { getCategories } from '@/app/actions/category'

export default function NewBlogPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string; description: string | null }[]>([])
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
    mainImageCaption: '',
    
    // Contenu principal
    content: '',
    
    // Tags
    tags: ''
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

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getCategories()
        if (result.success && result.categories) {
          setCategories(result.categories)
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    
    loadCategories()
  }, [])

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
    
    // Validate category
    if (!formData.category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)

    try {
      const result = await createBlogPost(formData)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: 'Success',
        description: 'Blog post created successfully',
      })
      
      router.push('/admin/blog-posts')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create blog post',
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
        <Accordion type="multiple" defaultValue={['meta', 'category', 'header', 'intro', 'content', 'tags']} className="space-y-4">
          {/* Méta-données de l'article */}
          <AccordionItem value="meta" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Meta-data of the article</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title of the article</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter the title of the article"
                    required
                    onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                      e.target.setCustomValidity('Please fill out this field')
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
                        placeholder="titre-de-larticle"
                        required={!shouldAutoUpdateSlug}
                        onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                          e.target.setCustomValidity(shouldAutoUpdateSlug ? '' : 'Please fill out this field')
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
                      'The slug will update automatically based on the title. Edit it manually to disable auto-update.' : 
                      'Auto-update disabled. Click "Generate from title" to re-enable.'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt (meta description)</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    placeholder="Short summary of the article (150-160 characters recommended)"
                    className="min-h-[80px]"
                    required
                    onInvalid={(e: React.InvalidEvent<HTMLTextAreaElement>) => 
                      e.target.setCustomValidity('Please fill out this field')
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
                  <Label htmlFor="tags">Article Tags</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Enter tags separated by commas (e.g., technology, business, design)"
                  />
                  <p className="text-xs text-gray-500">
                    Tags help categorize your article and improve discoverability
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* En-tête de l'article */}
          <AccordionItem value="header" className="border rounded-md px-4">
            <AccordionTrigger className="text-xl font-semibold">Header of the article</AccordionTrigger>
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
                      e.target.setCustomValidity('Please fill out this field')
                    }
                    onInput={(e: React.FormEvent<HTMLInputElement>) => 
                      e.currentTarget.setCustomValidity('')
                    }
                  />
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
                      e.target.setCustomValidity('Please fill out this field')
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
            <AccordionTrigger className="text-xl font-semibold">Main Image and Introduction</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="introText">Introduction Text</Label>
                  <Textarea
                    id="introText"
                    name="introText"
                    value={formData.introText}
                    onChange={handleChange}
                    placeholder="Introduction paragraph that captures attention and summarizes the article"
                    className="min-h-[100px]"
                    required
                    onInvalid={(e: React.InvalidEvent<HTMLTextAreaElement>) => 
                      e.target.setCustomValidity('Please fill out this field')
                    }
                    onInput={(e: React.FormEvent<HTMLTextAreaElement>) => 
                      e.currentTarget.setCustomValidity('')
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mainImageUrl">Main Image URL</Label>
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
                    <Label htmlFor="mainImageAlt">Main Image Alt</Label>
                    <Input
                      id="mainImageAlt"
                      name="mainImageAlt"
                      value={formData.mainImageAlt}
                      onChange={handleChange}
                      placeholder="Detailed description of the image for accessibility and SEO"
                      required
                      onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => 
                        e.target.setCustomValidity('Please enter alt text for the image')
                      }
                      onInput={(e: React.FormEvent<HTMLInputElement>) => 
                        e.currentTarget.setCustomValidity('')
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mainImageCaption">Main Image Caption</Label>
                    <Input
                      id="mainImageCaption"
                      name="mainImageCaption"
                      value={formData.mainImageCaption}
                      onChange={handleChange}
                      placeholder="Detailed description of the image for accessibility and SEO"
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
            <AccordionTrigger className="text-xl font-semibold">Main Content</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-4">
                <Label htmlFor="content">Content of the article</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Write the content of your article here..."
                  className="min-h-[300px]"
                  required
                  onInvalid={(e: React.InvalidEvent<HTMLTextAreaElement>) => 
                    e.target.setCustomValidity('Please fill out this field')
                  }
                  onInput={(e: React.FormEvent<HTMLTextAreaElement>) => 
                    e.currentTarget.setCustomValidity('')
                  }
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
            onClick={() => router.push('/admin/blog-posts')}
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
            {isSubmitting ? 'Saving...' : 'Save Post'}
          </Button>
        </div>
      </form>
    </div>
  )
} 
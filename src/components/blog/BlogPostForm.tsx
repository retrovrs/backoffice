'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { BlogPostSEOHelper } from '@/components/blog/BlogPostSEOHelper'
import { BlogPostSEOAssistantContent } from '@/components/blog/BlogPostSEOAssistant'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Composant individuel pour un élément de catégorie
const CategoryItem = memo(({ 
  category, 
  isSelected, 
  onSelect 
}: { 
  category: { id: number; name: string; description: string | null }
  isSelected: boolean
  onSelect: () => void
}) => {
  return (
    <div className="flex items-start space-x-2">
      <RadioGroupItem 
        value={category.name} 
        id={`category-${category.id}`} 
        className="mt-1"
        checked={isSelected}
        onClick={onSelect}
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
  )
})
CategoryItem.displayName = 'CategoryItem'

// Composant pour la sélection de catégorie avec mémoisation
const CategorySelector = memo(({ 
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: string,
  onCategoryChange: (category: string) => void
}) => {
  const [categories, setCategories] = useState<{ id: number; name: string; description: string | null }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [manualCategory, setManualCategory] = useState('')
  
  // Charger les catégories une seule fois
  useEffect(() => {
    let isMounted = true
    
    async function loadCategories() {
      try {
        const result = await getCategories()
        if (isMounted && result.success && result.categories) {
          setCategories(result.categories)
        }
      } catch (error) {
        console.error('Error when loading the categories:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    loadCategories()
    
    return () => {
      isMounted = false
    }
  }, [])
  
  // Gérer le changement de catégorie manuelle
  const handleManualCategoryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManualCategory(value)
    onCategoryChange(value)
  }, [onCategoryChange])
  
  // Gérer la sélection d'une catégorie existante
  const handleRadioChange = useCallback((value: string) => {
    onCategoryChange(value)
  }, [onCategoryChange])
  
  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <p className="text-gray-500">Loading categories...</p>
      </div>
    )
  }
  
  if (categories.length === 0) {
    return (
      <div className="pt-4">
        <p className="text-gray-500 mb-2">No categories found. Enter a category name:</p>
        <Label htmlFor="manual-category">Category name</Label>
        <Input
          id="manual-category"
          type="text"
          value={manualCategory || selectedCategory}
          onChange={handleManualCategoryChange}
          placeholder="Enter a category name"
          className="max-w-md mt-1"
          required
        />
      </div>
    )
  }
  
  return (
    <div className="pt-4">
      <div className="flex items-center mb-4">
        <Label className="text-base font-medium">Select a category</Label>
        <span className="text-red-500 ml-1">*</span>
      </div>
      <RadioGroup 
        value={selectedCategory} 
        onValueChange={handleRadioChange}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {categories.map((category) => (
          <CategoryItem 
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.name}
            onSelect={() => handleRadioChange(category.name)}
          />
        ))}
      </RadioGroup>
    </div>
  )
})
CategorySelector.displayName = 'CategorySelector'

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
  
  console.log('BlogPostForm initialData:', {
    title: initialData.title,
    content: typeof initialData.content === 'string' ? initialData.content.substring(0, 100) + '...' : 'N/A',
    structuredContent: initialData.structuredContent ? 'Present' : 'Absent',
    structuredContentType: initialData.structuredContent ? typeof initialData.structuredContent : 'N/A'
  });
  
  if (initialData.structuredContent) {
    console.log('structuredContent preview:', 
      JSON.stringify(initialData.structuredContent).substring(0, 100) + '...'
    );
  }
  
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
  const [isSEODialogOpen, setIsSEODialogOpen] = useState(false)

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
  }, [])

  // Auto-update slug based on title if enabled
  useEffect(() => {
    if (shouldAutoUpdateSlug && formData.title) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.title)
      }))
    }
  }, [formData.title, shouldAutoUpdateSlug, generateSlug])

  const handleChange = useCallback((
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
  }, [formData.title, generateSlug])

  // Mémoiser cette fonction pour éviter les re-renders inutiles
  const handleCategoryChange = useCallback((category: string) => {
    setFormData(prev => ({
      ...prev,
      category
    }))
  }, [])

  // Gérer les changements du contenu structuré
  const handleContentChange = useCallback((jsonContent: string, rawContent: string) => {
    try {
      const structuredContent = JSON.parse(jsonContent);
      
      setFormData(prev => ({
        ...prev,
        content: rawContent,
        structuredContent: structuredContent
      }));
    } catch (error) {
      console.error('Erreur lors du parsing du contenu JSON:', error);
      // En cas d'erreur, mettre à jour uniquement le contenu brut
      setFormData(prev => ({
        ...prev,
        content: rawContent
      }));
    }
  }, []);

  // Fonction pour synchroniser le contenu de l'éditeur avant de l'utiliser
  const syncBlogEditorContent = useCallback((callback?: () => void) => {
    try {
      console.log("Synchronisation du contenu de l'éditeur...");
      
      // @ts-ignore
      if (window.syncBlogEditorContent) {
        // @ts-ignore
        const updatedSections = window.syncBlogEditorContent();
        
        // Si la synchronisation a réussi et retourne des données, mettre à jour formData
        if (updatedSections) {
          console.log("Contenu collecté depuis l'éditeur:", 
            JSON.stringify(updatedSections).substring(0, 100) + "...");
          
          // Mettre à jour formData avec les nouvelles valeurs
          // structuredContent = JSON à stocker en base de données
          // content = HTML généré pour l'affichage uniquement (pas stocké)
          setFormData(prev => {
            const newFormData = {
              ...prev,
              // Nous gardons content (HTML) pour l'affichage uniquement
              content: generateRawContentFromSections(updatedSections),
              // structuredContent est ce qui sera stocké en base de données
              structuredContent: updatedSections
            };
            
            console.log("État formData mis à jour avec nouveaux contenus");
            console.log("structuredContent (à stocker en DB):", 
              JSON.stringify(newFormData.structuredContent).substring(0, 100) + "...");
            
            // Exécuter le callback si fourni après la mise à jour
            if (callback) {
              setTimeout(() => {
                console.log("Exécution du callback après mise à jour");
                callback();
              }, 50);
            }
            
            return newFormData;
          });
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la synchronisation du contenu de l\'éditeur:', error);
      return false;
    }
  }, []);
  
  // Fonction pour générer le contenu brut à partir des sections (copie de la fonction dans BlogContentEditor)
  const generateRawContentFromSections = (sectionsArray: any[]): string => {
    return sectionsArray.map(section => {
      const sectionContent = section.elements.map((element: any) => {
        switch (element.type) {
          case 'h2':
            return `  <h2>${element.content}</h2>`
          case 'h3':
            return `  <h3>${element.content}</h3>`
          case 'paragraph':
            return `  <p>${element.content}</p>`
          case 'list':
            if (element.listItems && element.listItems.length > 0) {
              const listItems = element.listItems.map((item: string) => `    <li>${item}</li>`).join('\n')
              return `  <ul>\n${listItems}\n  </ul>`
            }
            return ''
          case 'image':
            return `  <figure>\n    <img src="${element.url || ''}" alt="${element.alt || ''}" />\n    <figcaption>${element.content}</figcaption>\n  </figure>`
          case 'video':
            // Simplifiée pour l'exemple
            return `  <figure class="video">\n    <video controls src="${element.url || ''}"></video>\n    <figcaption>${element.content}</figcaption>\n  </figure>`
          default:
            return `  <p>${element.content}</p>`
        }
      }).join('\n\n')
      
      return `<section>\n${sectionContent}\n</section>`
    }).join('\n\n')
  }

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Préparation à la soumission du formulaire");
    
    // Validate category first
    if (!formData.category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Synchroniser d'abord le contenu de l'éditeur
      console.log("Synchronisation du contenu avant soumission");
      
      // @ts-ignore
      if (window.syncBlogEditorContent) {
        // @ts-ignore
        const updatedSections = window.syncBlogEditorContent();
        
        if (updatedSections) {
          // Mise à jour manuelle des données du formulaire avant soumission
          const updatedFormData = {
            ...formData,
            content: generateRawContentFromSections(updatedSections),
            structuredContent: updatedSections
          };
          
          console.log("Contenus mis à jour avant soumission:", {
            structuredContent: updatedFormData.structuredContent 
              ? `JSON disponible (${JSON.stringify(updatedFormData.structuredContent).length} caractères)` 
              : "Absent"
          });
          
          // Soumettre directement avec les données mises à jour
          await onSubmit(updatedFormData);
          return;
        }
      }
      
      // Fallback si la synchronisation ne fonctionne pas
      console.log("Soumission avec données non synchronisées (fallback)");
      await onSubmit(formData);
      
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission du formulaire",
        variant: "destructive"
      });
    }
  }, [formData, onSubmit, toast, generateRawContentFromSections]);

  // Gestionnaire d'ouverture de l'assistant SEO
  const handleOpenSEOAssistant = useCallback(() => {
    // Synchroniser le contenu de l'éditeur avant d'ouvrir l'assistant
    syncBlogEditorContent(() => {
      // Ouvrir la dialog une fois que le contenu est synchronisé
      setIsSEODialogOpen(true);
    });
  }, [syncBlogEditorContent]);

  const pageTitle = mode === 'create' ? 'Create a new article' : 'Edit the article'
  const submitButtonText = isSubmitting 
    ? 'Saving...' 
    : (mode === 'create' ? 'Save the article' : 'Save the modifications')

  return (
    <div className="space-y-6 relative ml-16">
      {/* Bouton SEO Assistant en position fixe */}
      <Button 
        variant="outline"
        className="fixed left-60 top-1/2 transform -translate-y-1/2 z-50 bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 shadow-md"
        onClick={handleOpenSEOAssistant}
        disabled={isSubmitting}
      >
        SEO Assistant
      </Button>
      
      {/* Dialog SEO */}
      <Dialog open={isSEODialogOpen} onOpenChange={setIsSEODialogOpen}>
        <DialogContent className="w-screen max-w-[95vw] sm:max-w-[95vw] md:max-w-[95vw] lg:max-w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SEO Assistant</DialogTitle>
            <DialogDescription>
              Analyse et optimisation SEO de votre article
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <BlogPostSEOAssistantContent 
              formData={formData} 
              disabled={isSubmitting} 
            />
          </div>
        </DialogContent>
      </Dialog>
      
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
              <CategorySelector 
                selectedCategory={formData.category}
                onCategoryChange={handleCategoryChange}
              />
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
                {(() => {
                  console.log('Rendering BlogContentEditor with:', {
                    hasStructuredContent: !!formData.structuredContent,
                    contentPreview: typeof formData.content === 'string' ? formData.content.substring(0, 50) + '...' : 'N/A',
                    passedContent: formData.structuredContent ? 'Using structuredContent' : 'Using raw content'
                  });
                  return null;
                })()}
                <BlogContentEditor
                  initialContent={formData.structuredContent || formData.content}
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
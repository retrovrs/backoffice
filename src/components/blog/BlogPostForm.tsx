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
import { Badge } from '@/components/ui/badge'
import { getCategories } from '@/lib/actions/category'
import { BlogPostFormValues } from '@/types/blog'
import { generateSlug as utilsGenerateSlug } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createOrUpdateSeoTags, getSeoTagsByPostId } from '@/lib/actions/seo-tags'

// Composant individuel pour un élément de catégorie
const CategoryItem = memo(({ 
  category, 
  isSelected, 
  onSelect 
}: { 
  category: { id: number; name: string; shortDescription: string | null }
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
        {category.shortDescription && (
          <p className="text-sm text-gray-500">
            {category.shortDescription}
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
  const [categories, setCategories] = useState<{ id: number; name: string; shortDescription: string | null }[]>([])
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
  initialData?: Partial<BlogPostFormValues> & { id?: number }
  onSubmit: (formData: BlogPostFormValues) => Promise<{ success: boolean; postId?: number } | void>
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
  
  // Ajoutons un log pour voir les tags initiaux
  console.log('Initial tags:', initialData.tags);
  
  // Ajoutons plus de détails pour le débogage
  console.log('BlogPostForm - Initialisation avec:', {
    tagsFromServer: initialData.tags,
    tagsType: typeof initialData.tags,
    tagsLength: initialData.tags ? initialData.tags.length : 0,
    mode: mode
  });
  
  const [formData, setFormData] = useState<BlogPostFormValues>({
    // Méta-données
    title: initialData.title || '',
    slug: initialData.slug || '',
    excerpt: initialData.excerpt || '',
    status: initialData.status || 'draft',
    category: initialData.category || 'blog',
    pinned: initialData.pinned || false,
    
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
    generatedHtml: initialData.generatedHtml || '',
    
    // Tags
    tags: initialData.tags || ''
  })
  
  // Initialisons correctement les tags à partir des données initiales
  let initialTagsArray: string[] = [];
  if (initialData.tags && typeof initialData.tags === 'string' && initialData.tags.trim() !== '') {
    initialTagsArray = initialData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
    console.log('Tags initiaux après parsing:', initialTagsArray);
  } else {
    console.log('Aucun tag initial ou format invalide');
  }
  
  const [parsedTags, setParsedTags] = useState<string[]>(initialTagsArray)
  
  // Utilisation de la fonction externalisée avec useCallback pour la mémorisation
  const generateSlug = useCallback((title: string) => {
    return utilsGenerateSlug(title)
  }, [])
  
  // Détermine si on doit générer automatiquement le slug:
  // En mode création: toujours activé par défaut
  // En mode édition: activé si le slug est vide ou identique au slug généré à partir du titre
  const initialAutoUpdateSlug = mode === 'create' || 
    !initialData.slug || 
    initialData.slug === generateSlug(initialData.title || '');
  
  const [shouldAutoUpdateSlug, setShouldAutoUpdateSlug] = useState(initialAutoUpdateSlug)
  const [isSEODialogOpen, setIsSEODialogOpen] = useState(false)
  const [currentTag, setCurrentTag] = useState('')
  
  // Synchroniser parsedTags avec formData.tags
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      tags: parsedTags.join(',')
    }))
  }, [parsedTags])
  
  // Log pour débogage des tags
  useEffect(() => {
    console.log('Tags updated:', parsedTags)
  }, [parsedTags])
  
  // Ajoutés pour la gestion des tags SEO
  const [isSyncingTags, setIsSyncingTags] = useState(false)
  
  // Ajoutons un useEffect pour charger les tags SEO en mode édition
  useEffect(() => {
    if (mode === 'edit' && initialData.id) {
      const loadSeoTags = async () => {
        try {
          const result = await getSeoTagsByPostId(initialData.id as number);
          if (result.success && result.tags.length > 0) {
            // Si on a déjà chargé des tags depuis le champ tags, on conserve ceux-là
            // Sinon on utilise les tags SEO
            if (!parsedTags.length) {
              console.log('Chargement des tags SEO:', result.tags);
              setParsedTags(result.tags);
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement des tags SEO:', error);
        }
      };
      
      loadSeoTags();
    }
  }, [mode, initialData.id, parsedTags.length]);

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
        structuredContent: structuredContent,
        generatedHtml: rawContent
      }));
    } catch (error) {
      console.error('Error when parsing the JSON content:', error);
      // En cas d'erreur, mettre à jour uniquement le contenu brut
      setFormData(prev => ({
        ...prev,
        content: rawContent,
        generatedHtml: rawContent
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
          
          // Générer le HTML à partir des sections
          const generatedHtml = generateRawContentFromSections(updatedSections);
          
          // Mettre à jour formData avec les nouvelles valeurs
          // structuredContent = JSON à stocker en base de données
          // content = HTML généré pour l'affichage uniquement (pas stocké)
          // generatedHtml = HTML généré pour stocker en DB
          setFormData(prev => {
            const newFormData = {
              ...prev,
              // Nous gardons content (HTML) pour l'affichage uniquement
              content: generatedHtml,
              // structuredContent est ce qui sera stocké en base de données
              structuredContent: updatedSections,
              // generatedHtml est le HTML qui sera stocké en DB
              generatedHtml: generatedHtml
            };
            
            console.log("État formData mis à jour avec nouveaux contenus");
            console.log("structuredContent (à stocker en DB):", 
              JSON.stringify(newFormData.structuredContent).substring(0, 100) + "...");
            console.log("generatedHtml (à stocker en DB):", 
              newFormData.generatedHtml.substring(0, 100) + "...");
            
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
      console.error('Error when synchronizing the editor content:', error);
      return false;
    }
  }, []);
  
  // Fonction pour générer le contenu brut à partir des sections (copie de la fonction dans BlogContentEditor)
  const generateRawContentFromSections = (sectionsArray: any[]): string => {
    let content = sectionsArray.map(section => {
      const sectionContent = section.elements.map((element: any) => {
        switch (element.type) {
          case 'h2':
            return `  <br/><h2>${element.content}</h2>`
          case 'h3':
            return `  <br/><h3>${element.content}</h3>`
          case 'paragraph':
            return `  <p style="font-family: 'Poppins', sans-serif; font-weight: 400;">${element.content}</p>`
          case 'list':
            if (element.listItems && element.listItems.length > 0) {
              const listItems = element.listItems.map((item: string) => `    <li style="font-family: 'Poppins', sans-serif; font-weight: 400;">${item}</li>`).join('\n')
              return `  <ul style="font-family: 'Poppins', sans-serif; font-weight: 400;">\n${listItems}\n  </ul>`
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
    
    // Note: Nous ne générons plus le footer avec les tags ici
    // pour éviter la duplication avec l'assistant SEO
    
    return content
  }

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Préparation à la soumission du formulaire");
    
    // Validate category first
    if (!formData.category) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une catégorie",
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
          // Générer le HTML à partir des sections
          const generatedHtml = generateRawContentFromSections(updatedSections);
          
          // Mise à jour manuelle des données du formulaire avant soumission
          const updatedFormData = {
            ...formData,
            content: generatedHtml,
            structuredContent: updatedSections,
            generatedHtml: generatedHtml
          };
          
          console.log("Contenus mis à jour avant soumission:", {
            structuredContent: updatedFormData.structuredContent 
              ? `JSON disponible (${JSON.stringify(updatedFormData.structuredContent).length} caractères)` 
              : "Absent",
            generatedHtml: updatedFormData.generatedHtml
              ? `HTML disponible (${updatedFormData.generatedHtml.length} caractères)`
              : "Absent"
          });
          
          // Soumettre le formulaire
          const result = await onSubmit(updatedFormData);
          
          // Si nous avons un ID de post (création ou édition réussie)
          // Le postId peut venir du résultat ou de initialData.id en mode édition
          const postId = result && 'postId' in result ? result.postId : (mode === 'edit' ? initialData.id : undefined);
          
          if (postId) {
            // Synchroniser les tags SEO
            setIsSyncingTags(true);
            try {
              const tagNames = parsedTags.map(tag => tag.trim());
              await createOrUpdateSeoTags(postId, tagNames);
            } catch (error) {
              console.error('Erreur lors de la synchronisation des tags SEO:', error);
              toast({
                title: "Avertissement",
                description: "L'article a été enregistré mais il y a eu un problème avec les tags SEO",
                variant: "default"
              });
            } finally {
              setIsSyncingTags(false);
            }
          }
          
          return;
        }
      }
      
      // Fallback si la synchronisation ne fonctionne pas
      console.log("Soumission avec données non synchronisées (fallback)");
      const result = await onSubmit(formData);
      
      // Si nous avons un ID de post (création ou édition réussie)
      // Le postId peut venir du résultat ou de initialData.id en mode édition
      const postId = result && 'postId' in result ? result.postId : (mode === 'edit' ? initialData.id : undefined);
      
      if (postId) {
        // Synchroniser les tags SEO
        setIsSyncingTags(true);
        try {
          const tagNames = parsedTags.map(tag => tag.trim());
          await createOrUpdateSeoTags(postId, tagNames);
        } catch (error) {
          console.error('Erreur lors de la synchronisation des tags SEO:', error);
          toast({
            title: "Avertissement",
            description: "L'article a été enregistré mais il y a eu un problème avec les tags SEO",
            variant: "default"
          });
        } finally {
          setIsSyncingTags(false);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission du formulaire",
        variant: "destructive"
      });
    }
  }, [formData, onSubmit, toast, generateRawContentFromSections, parsedTags, mode, initialData.id]);

  // Gestionnaire d'ouverture de l'assistant SEO
  const handleOpenSEOAssistant = useCallback(() => {
    try {
      // Synchroniser le contenu de l'éditeur avant d'ouvrir l'assistant
      syncBlogEditorContent();
      
      // Ouvrir la dialog immédiatement sans attendre le callback
      // qui peut ne jamais être appelé si la synchronisation échoue
      setIsSEODialogOpen(true);
    } catch (error) {
      console.error('Error when opening the SEO assistant:', error);
      // En cas d'erreur, ouvrir quand même la modale
      setIsSEODialogOpen(true);
    }
  }, [syncBlogEditorContent]);

  const pageTitle = mode === 'create' ? 'Create a new article' : 'Edit the article'
  const submitButtonText = isSubmitting 
    ? 'Saving...' 
    : (mode === 'create' ? 'Create the article' : 'Save')

  // Fonction pour gérer le clic sur le bouton Publier
  const handlePublish = useCallback(async () => {
    // Mettre à jour l'état local avec le nouveau statut
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        status: 'published'
      };
      
      // Synchroniser le contenu de l'éditeur si disponible
      try {
        // @ts-ignore
        if (window.syncBlogEditorContent) {
          // @ts-ignore
          const updatedSections = window.syncBlogEditorContent();
          
          if (updatedSections) {
            // Générer le HTML à partir des sections
            const generatedHtml = generateRawContentFromSections(updatedSections);
            
            // Mettre à jour avec le contenu synchronisé
            updatedFormData.content = generatedHtml;
            updatedFormData.structuredContent = updatedSections;
            updatedFormData.generatedHtml = generatedHtml;
          }
        }
      } catch (error) {
        console.error('Error when synchronizing the content for publication:', error);
      }
      
      // Soumettre les données mises à jour à la base de données
      setTimeout(async () => {
        try {
          console.log("Soumission du formulaire pour publication:", updatedFormData);
          const result = await onSubmit(updatedFormData);
          
          // Si nous avons un ID de post (création ou édition réussie)
          // Le postId peut venir du résultat ou de initialData.id en mode édition
          const postId = result && 'postId' in result ? result.postId : (mode === 'edit' ? initialData.id : undefined);
          
          if (postId) {
            // Synchroniser les tags SEO
            setIsSyncingTags(true);
            try {
              const tagNames = parsedTags.map(tag => tag.trim());
              await createOrUpdateSeoTags(postId, tagNames);
            } catch (error) {
              console.error('Erreur lors de la synchronisation des tags SEO:', error);
              toast({
                title: "Avertissement",
                description: "L'article a été publié mais il y a eu un problème avec les tags SEO",
                variant: "default"
              });
            } finally {
              setIsSyncingTags(false);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la publication de l\'article:', error);
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la publication de l'article",
            variant: "destructive"
          });
        }
      }, 0);
      
      return updatedFormData;
    });
  }, [onSubmit, generateRawContentFromSections, toast, parsedTags, mode, initialData.id]);

  // Fonction pour gérer le clic sur le bouton Dépublier
  const handleUnpublish = useCallback(async () => {
    // Mettre à jour l'état local avec le nouveau statut
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        status: 'draft'
      };
      
      // Synchroniser le contenu de l'éditeur si disponible
      try {
        // @ts-ignore
        if (window.syncBlogEditorContent) {
          // @ts-ignore
          const updatedSections = window.syncBlogEditorContent();
          
          if (updatedSections) {
            // Générer le HTML à partir des sections
            const generatedHtml = generateRawContentFromSections(updatedSections);
            
            // Mettre à jour avec le contenu synchronisé
            updatedFormData.content = generatedHtml;
            updatedFormData.structuredContent = updatedSections;
            updatedFormData.generatedHtml = generatedHtml;
          }
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation du contenu pour dépublication:', error);
      }
      
      // Soumettre les données mises à jour à la base de données
      setTimeout(async () => {
        try {
          console.log("Soumission du formulaire pour dépublication:", updatedFormData);
          const result = await onSubmit(updatedFormData);
          
          // Si nous avons un ID de post (création ou édition réussie)
          // Le postId peut venir du résultat ou de initialData.id en mode édition
          const postId = result && 'postId' in result ? result.postId : (mode === 'edit' ? initialData.id : undefined);
          
          if (postId) {
            // Synchroniser les tags SEO
            setIsSyncingTags(true);
            try {
              const tagNames = parsedTags.map(tag => tag.trim());
              await createOrUpdateSeoTags(postId, tagNames);
            } catch (error) {
              console.error('Erreur lors de la synchronisation des tags SEO:', error);
              toast({
                title: "Avertissement",
                description: "L'article a été dépublié mais il y a eu un problème avec les tags SEO",
                variant: "default"
              });
            } finally {
              setIsSyncingTags(false);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la dépublication de l\'article:', error);
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la dépublication de l'article",
            variant: "destructive"
          });
        }
      }, 0);
      
      return updatedFormData;
    });
  }, [onSubmit, generateRawContentFromSections, toast, parsedTags, mode, initialData.id]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, []);

  const handleAddTag = useCallback(() => {
    if (currentTag.trim()) {
      setParsedTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag('');
    }
  }, [currentTag]);

  const handleRemoveTag = useCallback((index: number) => {
    setParsedTags(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Fonction simplifiée pour gérer le basculement de l'état épinglé
  const handleTogglePin = useCallback(async () => {
    try {
      // Nouvelle valeur de pinned (inverse de l'état actuel)
      const newPinnedValue = !formData.pinned;
      
      // On a besoin de l'ID pour identifier l'article
      if (!initialData.id) {
        console.error("ID de l'article manquant");
        return;
      }
      
      // Mettre à jour l'interface utilisateur immédiatement
      setFormData(prev => ({
        ...prev,
        pinned: newPinnedValue
      }));
      
      // Appeler l'API pour mettre à jour uniquement le champ "pinned"
      const response = await fetch(`/api/blog-posts/toggle-pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: initialData.id, 
          pinned: newPinnedValue 
        })
      });
      
      if (!response.ok) {
        throw new Error('Échec de la mise à jour');
      }
      
      // Notification de succès
      toast({
        title: newPinnedValue ? "Article épinglé" : "Article désépinglé",
        description: newPinnedValue 
          ? "L'article sera affiché en priorité" 
          : "L'article a été retiré des articles épinglés",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'épinglage:", error);
      
      // Rétablir l'état précédent en cas d'erreur
      setFormData(prev => ({
        ...prev,
        pinned: !prev.pinned
      }));
      
      // Notification d'erreur
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de l'épinglage",
        variant: "destructive"
      });
    }
  }, [formData.pinned, formData.slug, toast]);

  return (
    <div className="space-y-6 relative ml-16">
      {/* Bouton SEO Assistant en position fixe */}
      <Button 
        variant="outline"
        className="fixed left-60 top-1/2 transform -translate-y-1/2 z-50 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-purple-400 hover:from-indigo-600 hover:to-purple-700 shadow-lg transition-all duration-300 hover:shadow-purple-300/50 hover:scale-105 dark:from-indigo-700 dark:to-purple-800 dark:text-white dark:border-purple-700 dark:hover:from-indigo-800 dark:hover:to-purple-900"
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
          {mode === 'edit' && (
            <Badge 
              variant="outline" 
              className={`ml-2 ${
                formData.status === 'published' 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {formData.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
            </Badge>
          )}
          {mode === 'edit' && formData.pinned && (
            <Badge 
              variant="outline" 
              className="ml-2 bg-blue-100 text-blue-800 border-blue-300"
            >
              PINNED
            </Badge>
          )}
          <BlogPostSEOHelper />
        </div>
        <div className="flex gap-2">
          {mode === 'edit' && (
            <Button
              variant="outline"
              onClick={handleTogglePin}
              className={`border-gray-300 bg-fuchsia-500 ${formData.pinned ? 'bg-blue-100 hover:bg-blue-200' : ''}`}
            >
              {formData.pinned ? 'Unpin' : 'Pin'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/blog-posts')}
            className="border-gray-300"
          >
            Cancel
          </Button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-200 dark:border-slate-700 dark:shadow-[0_0_15px_rgba(59,130,246,0.07)]">
        <Accordion type="multiple" defaultValue={['meta', 'category', 'header', 'intro', 'content', 'tags']} className="space-y-4 [&_input]:dark:bg-slate-800 [&_input]:dark:border-slate-700 [&_input]:dark:text-slate-200 [&_input::placeholder]:dark:text-slate-500 [&_textarea]:dark:bg-slate-800 [&_textarea]:dark:border-slate-700 [&_textarea]:dark:text-slate-200 [&_textarea::placeholder]:dark:text-slate-500 [&_[role=tablist]]:dark:bg-slate-800 [&_label]:dark:text-slate-300 [&_p]:dark:text-slate-400 [&_h3]:dark:text-slate-200 [&_div.border]:dark:border-slate-700 [&_.accordion-item]:dark:bg-slate-850 [&_button]:dark:border-slate-700 [&_button]:dark:text-slate-300">
          
          {/* Category */}
          <AccordionItem value="category" className="border rounded-md px-4 dark:bg-slate-800/60">
            <AccordionTrigger className="text-xl font-semibold dark:text-slate-200">Category</AccordionTrigger>
            <AccordionContent>
              <CategorySelector 
                selectedCategory={formData.category}
                onCategoryChange={handleCategoryChange}
              />
            </AccordionContent>
          </AccordionItem>
          
          {/* Méta-données de l'article */}
          <AccordionItem value="meta" className="border rounded-md px-4 dark:bg-slate-800/60">
            <AccordionTrigger className="text-xl font-semibold dark:text-slate-200">Article meta-data</AccordionTrigger>
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

          {/* Tags */}
          <AccordionItem value="tags" className="border rounded-md px-4 dark:bg-slate-800/60">
            <AccordionTrigger className="text-xl font-semibold dark:text-slate-200">Tags</AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tagInput">Add a tag</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="tagInput"
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        placeholder="Enter a tag and press Enter"
                        onKeyDown={handleTagKeyDown}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={handleAddTag}
                        disabled={!currentTag.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Tags help categorize your article and improve its visibility
                    </p>
                  </div>
                  
                  {parsedTags.length > 0 && (
                    <div className="space-y-2">
                      <Label>Added tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {parsedTags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary"
                            className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(index)}
                              className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 w-4 h-4 inline-flex items-center justify-center"
                              aria-label={`Remove the tag ${tag}`}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* En-tête de l'article */}
          <AccordionItem value="header" className="border rounded-md px-4 dark:bg-slate-800/60">
            <AccordionTrigger className="text-xl font-semibold dark:text-slate-200">Article header</AccordionTrigger>
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
          <AccordionItem value="intro" className="border rounded-md px-4 dark:bg-slate-800/60">
            <AccordionTrigger className="text-xl font-semibold dark:text-slate-200">Main image and introduction</AccordionTrigger>
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
          <AccordionItem value="content" className="border rounded-md px-4 dark:bg-slate-800/60">
            <AccordionTrigger className="text-xl font-semibold dark:text-slate-200">Main content</AccordionTrigger>
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
            disabled={isSubmitting || isSyncingTags}
            className="dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700"
          >
            Annuler
          </Button>
          {mode === 'edit' && formData.status === 'draft' && (
            <Button 
              type="button" 
              className="bg-green-600 hover:bg-green-700 transition-colors dark:bg-green-700 dark:hover:bg-green-800 dark:text-white"
              onClick={handlePublish}
              disabled={isSubmitting || isSyncingTags}
            >
              Publier
            </Button>
          )}
          {mode === 'edit' && formData.status === 'published' && (
            <Button 
              type="button" 
              className="bg-amber-600 hover:bg-amber-700 transition-colors dark:bg-amber-700 dark:hover:bg-amber-800 dark:text-white"
              onClick={handleUnpublish}
              disabled={isSubmitting || isSyncingTags}
            >
              Dépublier
            </Button>
          )}
          <Button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:text-white"
            disabled={isSubmitting || isSyncingTags}
          >
            {isSubmitting || isSyncingTags ? 'Enregistrement...' : submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  )
} 
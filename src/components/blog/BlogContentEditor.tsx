'use client'

import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { 
  ContentElement, 
  ContentElementType, 
  ContentSection, 
  StructuredContent 
} from '@/types/blog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusCircle, ChevronUp, ChevronDown, Trash2, Type, Image, Play, List, PenSquare, MoveUp, MoveDown } from 'lucide-react'

interface BlogContentEditorProps {
  initialContent: string
  onChange: (jsonContent: string, rawContent: string) => void
}

export function BlogContentEditor({ initialContent, onChange }: BlogContentEditorProps) {
  const [sections, setSections] = useState<ContentSection[]>([])
  const initialContentRef = useRef(initialContent)
  const isInitialMount = useRef(true)
  const isProcessingChange = useRef(false)
  
  // Convertir le contenu initial en sections structurées si possible
  useEffect(() => {
    // Ne pas réinitialiser si le contenu initial n'a pas changé
    if (initialContentRef.current === initialContent && !isInitialMount.current) {
      return
    }
    
    initialContentRef.current = initialContent
    
    if (!initialContent) {
      // Si aucun contenu initial, créer une section vide
      setSections([createEmptySection()])
      isInitialMount.current = false
      return
    }
    
    try {
      // Essayer de parser le contenu comme JSON structuré
      const parsedContent = JSON.parse(initialContent) as StructuredContent
      if (Array.isArray(parsedContent) && parsedContent.length > 0) {
        // Vérifier que c'est bien dans le format attendu
        let isValid = true
        for (const section of parsedContent) {
          if (!section.id || !Array.isArray(section.elements)) {
            isValid = false
            break
          }
        }
        
        if (isValid) {
          setSections(parsedContent)
          isInitialMount.current = false
          return
        }
      }
    } catch (e) {
      // Si le parsing échoue, ce n'est pas un JSON valide
    }
    
    // Fallback: créer une section avec le contenu comme paragraphe
    const initialSection = createEmptySection()
    if (initialContent.trim()) {
      initialSection.elements.push({
        id: uuidv4(),
        type: 'paragraph',
        content: initialContent
      })
    }
    setSections([initialSection])
    isInitialMount.current = false
  }, [initialContent]) // Ajouter initialContent comme dépendance
  
  // Référence pour éviter les mises à jour en cascade
  const sectionsRef = useRef(sections)
  
  // Mettre à jour la référence quand sections change
  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])
  
  // Mettre à jour le contenu parent quand les sections changent, mais sans créer une boucle
  useEffect(() => {
    // Ne pas déclencher onChange lors du montage initial, si sections est vide ou si on est déjà en train de traiter un changement
    if (isInitialMount.current || sections.length === 0 || isProcessingChange.current) {
      return
    }
    
    isProcessingChange.current = true
    
    try {
      const jsonContent = JSON.stringify(sections)
      // Générer aussi un contenu texte brut pour la rétrocompatibilité
      const rawContent = generateRawContent(sections)
      onChange(jsonContent, rawContent)
    } finally {
      // S'assurer que le flag est remis à false même en cas d'erreur
      isProcessingChange.current = false
    }
  }, [sections, onChange])
  
  // Générer un contenu texte brut à partir des sections structurées
  const generateRawContent = (sectionsArray: ContentSection[]): string => {
    return sectionsArray.map(section => {
      const sectionContent = section.elements.map(element => {
        switch (element.type) {
          case 'h2':
            return `  <h2>${element.content}</h2>`
          case 'h3':
            return `  <h3>${element.content}</h3>`
          case 'paragraph':
            return `  <p>${element.content}</p>`
          case 'list':
            if (element.listItems && element.listItems.length > 0) {
              const listItems = element.listItems.map(item => `    <li>${item}</li>`).join('\n')
              return `  <ul>\n${listItems}\n  </ul>`
            }
            return ''
          case 'image':
            return `  <figure>\n    <img src="${element.url || ''}" alt="${element.alt || ''}" />\n    <figcaption>${element.content}</figcaption>\n  </figure>`
          case 'video':
            // Pour une vidéo, on utilise une iframe si c'est YouTube ou une balise vidéo sinon
            const isYouTubeUrl = (element.url || '').includes('youtube.com') || (element.url || '').includes('youtu.be')
            if (isYouTubeUrl) {
              const youtubeId = extractYouTubeId(element.url || '')
              return `  <figure class="video">\n    <iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>\n    <figcaption>${element.content}</figcaption>\n  </figure>`
            } else {
              return `  <figure class="video">\n    <video controls src="${element.url || ''}"></video>\n    <figcaption>${element.content}</figcaption>\n  </figure>`
            }
          default:
            return `  <p>${element.content}</p>`
        }
      }).join('\n\n')
      
      // Encapsuler le contenu de la section dans une balise section sans attributs
      return `<section>\n${sectionContent}\n</section>`
    }).join('\n\n')
  }
  
  // Fonction pour extraire l'ID YouTube d'une URL
  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : ''
  }
  
  // Créer une section vide
  const createEmptySection = (): ContentSection => ({
    id: uuidv4(),
    elements: []
  })
  
  // Créer un élément vide du type spécifié
  const createEmptyElement = (type: ContentElementType): ContentElement => ({
    id: uuidv4(),
    type,
    content: '',
    listItems: type === 'list' ? [''] : undefined
  })
  
  // Ajouter une nouvelle section
  const addSection = () => {
    setSections(prev => [...prev, createEmptySection()])
  }
  
  // Supprimer une section
  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId))
  }
  
  // Ajouter un élément à une section
  const addElement = (sectionId: string, type: ContentElementType) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          elements: [...section.elements, createEmptyElement(type)]
        }
      }
      return section
    }))
  }
  
  // Supprimer un élément
  const removeElement = (sectionId: string, elementId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          elements: section.elements.filter(el => el.id !== elementId)
        }
      }
      return section
    }))
  }
  
  // Mettre à jour un élément
  const updateElement = (sectionId: string, elementId: string, updates: Partial<ContentElement>) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          elements: section.elements.map(el => {
            if (el.id === elementId) {
              return { ...el, ...updates }
            }
            return el
          })
        }
      }
      return section
    }))
  }
  
  // Mettre à jour un item de liste
  const updateListItem = (sectionId: string, elementId: string, index: number, value: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          elements: section.elements.map(el => {
            if (el.id === elementId && el.listItems) {
              const newListItems = [...el.listItems]
              newListItems[index] = value
              return { ...el, listItems: newListItems }
            }
            return el
          })
        }
      }
      return section
    }))
  }
  
  // Ajouter un item à une liste
  const addListItem = (sectionId: string, elementId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          elements: section.elements.map(el => {
            if (el.id === elementId && el.listItems) {
              return { ...el, listItems: [...el.listItems, ''] }
            }
            return el
          })
        }
      }
      return section
    }))
  }
  
  // Supprimer un item de liste
  const removeListItem = (sectionId: string, elementId: string, index: number) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          elements: section.elements.map(el => {
            if (el.id === elementId && el.listItems && el.listItems.length > 1) {
              const newListItems = [...el.listItems]
              newListItems.splice(index, 1)
              return { ...el, listItems: newListItems }
            }
            return el
          })
        }
      }
      return section
    }))
  }
  
  // Déplacer un élément vers le haut
  const moveElementUp = (sectionId: string, index: number) => {
    if (index <= 0) return
    
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const newElements = [...section.elements]
        const temp = newElements[index]
        newElements[index] = newElements[index - 1]
        newElements[index - 1] = temp
        return { ...section, elements: newElements }
      }
      return section
    }))
  }
  
  // Déplacer un élément vers le bas
  const moveElementDown = (sectionId: string, index: number) => {
    setSections(prev => {
      const section = prev.find(s => s.id === sectionId)
      if (!section || index >= section.elements.length - 1) return prev
      
      return prev.map(section => {
        if (section.id === sectionId) {
          const newElements = [...section.elements]
          const temp = newElements[index]
          newElements[index] = newElements[index + 1]
          newElements[index + 1] = temp
          return { ...section, elements: newElements }
        }
        return section
      })
    })
  }
  
  // Déplacer une section vers le haut
  const moveSectionUp = (index: number) => {
    if (index <= 0) return
    
    setSections(prev => {
      const newSections = [...prev]
      const temp = newSections[index]
      newSections[index] = newSections[index - 1]
      newSections[index - 1] = temp
      return newSections
    })
  }
  
  // Déplacer une section vers le bas
  const moveSectionDown = (index: number) => {
    setSections(prev => {
      if (index >= prev.length - 1) return prev
      
      const newSections = [...prev]
      const temp = newSections[index]
      newSections[index] = newSections[index + 1]
      newSections[index + 1] = temp
      return newSections
    })
  }
  
  return (
    <div className="space-y-8">
      {sections.map((section, sectionIndex) => (
        <Card key={section.id} className="border border-violet-200 shadow-sm">
          <CardHeader className="bg-violet-50 flex flex-row items-center justify-between p-4">
            <CardTitle className="text-lg font-medium text-violet-800">
              Section {sectionIndex + 1}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => moveSectionUp(sectionIndex)}
                disabled={sectionIndex === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => moveSectionDown(sectionIndex)}
                disabled={sectionIndex === sections.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeSection(section.id)}
                disabled={sections.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-4 bg-violet-50/30">
            {section.elements.map((element, elementIndex) => (
              <div 
                key={element.id} 
                className={`border rounded-md p-4 space-y-3 ${
                  element.type === 'h2' ? 'bg-pink-50 border-pink-200' : 
                  element.type === 'h3' ? 'bg-pink-100/70 border-pink-200' : 
                  element.type === 'paragraph' ? 'bg-white border-pink-100' : 
                  element.type === 'image' ? 'bg-violet-50 border-violet-200' : 
                  element.type === 'video' ? 'bg-violet-100/70 border-violet-200' : 
                  element.type === 'list' ? 'bg-pink-50/70 border-pink-100' : 
                  'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`text-sm font-medium p-1 px-2 rounded ${
                      element.type === 'h2' ? 'bg-pink-200 text-pink-800' : 
                      element.type === 'h3' ? 'bg-pink-300 text-pink-900' : 
                      element.type === 'paragraph' ? 'bg-pink-100 text-pink-800' : 
                      element.type === 'image' ? 'bg-violet-200 text-violet-800' : 
                      element.type === 'video' ? 'bg-violet-300 text-violet-900' : 
                      element.type === 'list' ? 'bg-pink-200 text-pink-900' : 
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {element.type === 'h2' && 'H2'}
                      {element.type === 'h3' && 'H3'}
                      {element.type === 'paragraph' && 'P'}
                      {element.type === 'image' && 'Image'}
                      {element.type === 'video' && 'Vidéo'}
                      {element.type === 'list' && 'Liste'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveElementUp(section.id, elementIndex)}
                      disabled={elementIndex === 0}
                      className="text-violet-700 hover:text-violet-800 hover:bg-violet-100"
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveElementDown(section.id, elementIndex)}
                      disabled={elementIndex === section.elements.length - 1}
                      className="text-violet-700 hover:text-violet-800 hover:bg-violet-100"
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeElement(section.id, element.id)}
                      className="text-pink-700 hover:text-pink-800 hover:bg-pink-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {element.type === 'h2' && (
                  <div className="space-y-1">
                    {/* <Label htmlFor={`h2-${element.id}`} className="text-pink-800">Titre (H2)</Label> */}
                    <Input 
                      id={`h2-${element.id}`}
                      value={element.content}
                      onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                      placeholder="Main title"
                      className="border-pink-200 focus:border-pink-300 focus:ring-pink-200"
                    />
                  </div>
                )}
                
                {element.type === 'h3' && (
                  <div className="space-y-1">
                    {/* <Label htmlFor={`h3-${element.id}`} className="text-pink-900">Sous-titre (H3)</Label> */}
                    <Input 
                      id={`h3-${element.id}`}
                      value={element.content}
                      onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                      placeholder="Subtitle"
                      className="border-pink-200 focus:border-pink-300 focus:ring-pink-200"
                    />
                  </div>
                )}
                
                {element.type === 'paragraph' && (
                  <div className="space-y-1">
                    {/* <Label htmlFor={`paragraph-${element.id}`} className="text-pink-800">Paragraphe</Label> */}
                    <Textarea 
                      id={`paragraph-${element.id}`}
                      value={element.content}
                      onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                      placeholder="Paragraph content ..."
                      className="min-h-[100px] border-pink-100 focus:border-pink-200 focus:ring-pink-100"
                    />
                  </div>
                )}
                
                {element.type === 'image' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor={`image-url-${element.id}`} className="text-violet-800">Image URL</Label>
                      <Input 
                        id={`image-url-${element.id}`}
                        value={element.url || ''}
                        onChange={(e) => updateElement(section.id, element.id, { url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="border-violet-200 focus:border-violet-300 focus:ring-violet-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`image-alt-${element.id}`} className="text-violet-800">Alternatif Text</Label>
                      <Input 
                        id={`image-alt-${element.id}`}
                        value={element.alt || ''}
                        onChange={(e) => updateElement(section.id, element.id, { alt: e.target.value })}
                        placeholder="Image description"
                        className="border-violet-200 focus:border-violet-300 focus:ring-violet-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`image-caption-${element.id}`} className="text-violet-800">Caption</Label>
                      <Input 
                        id={`image-caption-${element.id}`}
                        value={element.content}
                        onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                        placeholder="Image caption"
                        className="border-violet-200 focus:border-violet-300 focus:ring-violet-200"
                      />
                    </div>
                  </div>
                )}
                
                {element.type === 'video' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor={`video-url-${element.id}`} className="text-violet-900">Video URL</Label>
                      <Input 
                        id={`video-url-${element.id}`}
                        value={element.url || ''}
                        onChange={(e) => updateElement(section.id, element.id, { url: e.target.value })}
                        placeholder="https://example.com/video.mp4 ou ID YouTube"
                        className="border-violet-300 focus:border-violet-400 focus:ring-violet-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`video-caption-${element.id}`} className="text-violet-900">Caption</Label>
                      <Input 
                        id={`video-caption-${element.id}`}
                        value={element.content}
                        onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                        placeholder="Video caption"
                        className="border-violet-300 focus:border-violet-400 focus:ring-violet-300"
                      />
                    </div>
                  </div>
                )}
                
                {element.type === 'list' && (
                  <div className="space-y-3">
                    <Label className="text-pink-800">List items</Label>
                    {element.listItems?.map((item, itemIndex) => (
                      <div key={`${element.id}-item-${itemIndex}`} className="flex items-center space-x-2">
                        <span className="text-pink-500">•</span>
                        <Input 
                          value={item}
                          onChange={(e) => updateListItem(section.id, element.id, itemIndex, e.target.value)}
                          placeholder={`Item ${itemIndex + 1}`}
                          className="flex-1 border-pink-100 focus:border-pink-200 focus:ring-pink-100"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeListItem(section.id, element.id, itemIndex)}
                          disabled={(element.listItems?.length || 0) <= 1}
                          className="text-pink-700 hover:bg-pink-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addListItem(section.id, element.id)}
                      className="mt-2 border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100"
                    >
                      Add an item
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {section.elements.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-violet-50/50 border border-dashed border-violet-200 rounded-lg">
                No elements in this section. Add elements using the buttons below.
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t border-violet-100 bg-violet-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'h2')}
                      className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                    >
                      <Type className="h-4 w-4 mr-2" /> H2
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a main title for the section</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'h3')}
                      className="bg-pink-100/70 border-pink-200 text-pink-800 hover:bg-pink-200/70"
                    >
                      <Type className="h-4 w-4 mr-2" /> H3
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a subtitle for the section</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'paragraph')}
                      className="bg-white border-pink-100 text-pink-700 hover:bg-pink-50"
                    >
                      <PenSquare className="h-4 w-4 mr-2" /> Paragraph
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a paragraph</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'image')}
                      className="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
                    >
                    <Image className="h-4 w-4 mr-2" /> Image
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add an image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'video')}
                      className="bg-violet-100/70 border-violet-200 text-violet-800 hover:bg-violet-200/70"
                    >
                      <Play className="h-4 w-4 mr-2" /> Video
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a video</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'list')}
                      className="bg-pink-50/70 border-pink-100 text-pink-700 hover:bg-pink-100"
                    >
                      <List className="h-4 w-4 mr-2" /> List
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a bulleted list</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardFooter>
        </Card>
      ))}
      
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addSection}
          className="flex items-center bg-violet-100 border-violet-300 text-violet-800 hover:bg-violet-200"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add a section
        </Button>
      </div>
    </div>
  )
} 
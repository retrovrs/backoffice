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
  
  // Convertir le contenu initial en sections structurées si possible
  useEffect(() => {
    // Ne pas réinitialiser si le contenu initial n'a pas changé
    if (initialContentRef.current === initialContent && !isInitialMount.current) {
      return
    }
    
    initialContentRef.current = initialContent
    isInitialMount.current = false
    
    if (!initialContent) {
      // Si aucun contenu initial, créer une section vide
      setSections([createEmptySection()])
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
  }, [initialContent]) // Ajouter initialContent comme dépendance
  
  // Référence pour éviter les mises à jour en cascade
  const sectionsRef = useRef(sections)
  
  // Mettre à jour la référence quand sections change
  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])
  
  // Mettre à jour le contenu parent quand les sections changent, mais sans créer une boucle
  useEffect(() => {
    // Ne pas déclencher onChange lors du montage initial ou si sections est vide
    if (isInitialMount.current || sections.length === 0) {
      return
    }
    
    const jsonContent = JSON.stringify(sections)
    // Générer aussi un contenu texte brut pour la rétrocompatibilité
    const rawContent = generateRawContent(sections)
    onChange(jsonContent, rawContent)
  }, [sections, onChange])
  
  // Générer un contenu texte brut à partir des sections structurées
  const generateRawContent = (sectionsArray: ContentSection[]): string => {
    return sectionsArray.map(section => {
      return section.elements.map(element => {
        switch (element.type) {
          case 'h2':
            return `## ${element.content}\n\n`
          case 'h3':
            return `### ${element.content}\n\n`
          case 'paragraph':
            return `${element.content}\n\n`
          case 'list':
            if (element.listItems && element.listItems.length > 0) {
              return element.listItems.map(item => `- ${item}`).join('\n') + '\n\n'
            }
            return ''
          case 'image':
            return `![${element.alt || ''}](${element.url || ''})\n${element.content}\n\n`
          case 'video':
            return `[Vidéo: ${element.content}](${element.url || ''})\n\n`
          default:
            return element.content + '\n\n'
        }
      }).join('')
    }).join('\n')
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
        <Card key={section.id} className="border border-gray-200">
          <CardHeader className="bg-gray-50 flex flex-row items-center justify-between p-4">
            <CardTitle className="text-lg font-medium">
              Section {sectionIndex + 1}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => moveSectionUp(sectionIndex)}
                disabled={sectionIndex === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => moveSectionDown(sectionIndex)}
                disabled={sectionIndex === sections.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeSection(section.id)}
                disabled={sections.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-4">
            {section.elements.map((element, elementIndex) => (
              <div key={element.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium bg-gray-100 p-1 px-2 rounded">
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
                      variant="ghost"
                      size="icon"
                      onClick={() => moveElementUp(section.id, elementIndex)}
                      disabled={elementIndex === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveElementDown(section.id, elementIndex)}
                      disabled={elementIndex === section.elements.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeElement(section.id, element.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {element.type === 'h2' && (
                  <div className="space-y-1">
                    <Label htmlFor={`h2-${element.id}`}>Titre (H2)</Label>
                    <Input 
                      id={`h2-${element.id}`}
                      value={element.content}
                      onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                      placeholder="Titre principal"
                    />
                  </div>
                )}
                
                {element.type === 'h3' && (
                  <div className="space-y-1">
                    <Label htmlFor={`h3-${element.id}`}>Sous-titre (H3)</Label>
                    <Input 
                      id={`h3-${element.id}`}
                      value={element.content}
                      onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                      placeholder="Sous-titre"
                    />
                  </div>
                )}
                
                {element.type === 'paragraph' && (
                  <div className="space-y-1">
                    <Label htmlFor={`paragraph-${element.id}`}>Paragraphe</Label>
                    <Textarea 
                      id={`paragraph-${element.id}`}
                      value={element.content}
                      onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                      placeholder="Contenu du paragraphe"
                      className="min-h-[100px]"
                    />
                  </div>
                )}
                
                {element.type === 'image' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor={`image-url-${element.id}`}>URL de l'image</Label>
                      <Input 
                        id={`image-url-${element.id}`}
                        value={element.url || ''}
                        onChange={(e) => updateElement(section.id, element.id, { url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`image-alt-${element.id}`}>Texte alternatif</Label>
                      <Input 
                        id={`image-alt-${element.id}`}
                        value={element.alt || ''}
                        onChange={(e) => updateElement(section.id, element.id, { alt: e.target.value })}
                        placeholder="Description de l'image"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`image-caption-${element.id}`}>Légende</Label>
                      <Input 
                        id={`image-caption-${element.id}`}
                        value={element.content}
                        onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                        placeholder="Légende de l'image"
                      />
                    </div>
                  </div>
                )}
                
                {element.type === 'video' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor={`video-url-${element.id}`}>URL de la vidéo</Label>
                      <Input 
                        id={`video-url-${element.id}`}
                        value={element.url || ''}
                        onChange={(e) => updateElement(section.id, element.id, { url: e.target.value })}
                        placeholder="https://example.com/video.mp4 ou ID YouTube"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`video-caption-${element.id}`}>Légende</Label>
                      <Input 
                        id={`video-caption-${element.id}`}
                        value={element.content}
                        onChange={(e) => updateElement(section.id, element.id, { content: e.target.value })}
                        placeholder="Légende de la vidéo"
                      />
                    </div>
                  </div>
                )}
                
                {element.type === 'list' && (
                  <div className="space-y-3">
                    <Label>Éléments de la liste</Label>
                    {element.listItems?.map((item, itemIndex) => (
                      <div key={`${element.id}-item-${itemIndex}`} className="flex items-center space-x-2">
                        <span className="text-gray-500">•</span>
                        <Input 
                          value={item}
                          onChange={(e) => updateListItem(section.id, element.id, itemIndex, e.target.value)}
                          placeholder={`Élément ${itemIndex + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeListItem(section.id, element.id, itemIndex)}
                          disabled={(element.listItems?.length || 0) <= 1}
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
                      className="mt-2"
                    >
                      Add an element
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {section.elements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No elements in this section. Add elements using the buttons below.
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t border-gray-100 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'h2')}
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
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'h3')}
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
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'paragraph')}
                    >
                      <PenSquare className="h-4 w-4 mr-2" /> Paragraphe
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
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'image')}
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
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'video')}
                    >
                      <Play className="h-4 w-4 mr-2" /> Vidéo
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
                      variant="outline"
                      size="sm"
                      onClick={() => addElement(section.id, 'list')}
                    >
                      <List className="h-4 w-4 mr-2" /> Liste
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
          className="flex items-center"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add a section
        </Button>
      </div>
    </div>
  )
} 
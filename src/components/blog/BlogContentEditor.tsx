'use client'

import { useState, useEffect, useRef, memo, useCallback } from 'react'
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
  initialContent: string | StructuredContent
  onChange: (jsonContent: string, rawContent: string) => void
}

// Composant pour les tooltips d'actions
const ActionTooltip = memo(({ 
  label, 
  children 
}: { 
  label: string, 
  children: React.ReactNode 
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
})
ActionTooltip.displayName = 'ActionTooltip'

export function BlogContentEditor({ initialContent, onChange }: BlogContentEditorProps) {
  // Référence pour stocker la structure de données sans provoquer de re-renders inutiles
  const dataRef = useRef<{
    sections: ContentSection[],
    isInitialized: boolean
  }>({
    sections: [],
    isInitialized: false
  })
  
  // State minimal pour forcer le re-render uniquement quand la structure change
  const [renderCounter, forceUpdate] = useState(0)
  
  // Créer une section vide
  const createEmptySection = useCallback((): ContentSection => ({
    id: uuidv4(),
    elements: []
  }), [])
  
  // Créer un élément vide du type spécifié
  const createEmptyElement = useCallback((type: ContentElementType): ContentElement => {
    const element: ContentElement = {
      id: uuidv4(),
      type,
      content: ''
    }
    
    if (type === 'list') {
      element.listItems = ['']
    }
    
    return element
  }, [])
  
  // Fonction auxiliaire pour extraire les éléments dans leur ordre d'apparition
  const extractElementsInOrder = useCallback((htmlContent: string, section: ContentSection) => {
    console.log('Extracting elements in order from HTML:', htmlContent.substring(0, 100) + '...');
    
    // Créer un array pour stocker tous les éléments avec leur position
    const elements: { type: ContentElementType; content: string; position: number; url?: string; alt?: string; listItems?: string[] }[] = [];
    
    // Extraire les h2 avec leur position
    const h2Regex = /<h2>([\s\S]*?)<\/h2>/g;
    let h2Match;
    while ((h2Match = h2Regex.exec(htmlContent)) !== null) {
      elements.push({
        type: 'h2',
        content: h2Match[1].trim(),
        position: h2Match.index
      });
    }
    
    // Extraire les h3 avec leur position
    const h3Regex = /<h3>([\s\S]*?)<\/h3>/g;
    let h3Match;
    while ((h3Match = h3Regex.exec(htmlContent)) !== null) {
      elements.push({
        type: 'h3',
        content: h3Match[1].trim(),
        position: h3Match.index
      });
    }
    
    // Extraire les paragraphes avec leur position
    const pRegex = /<p>([\s\S]*?)<\/p>/g;
    let pMatch;
    while ((pMatch = pRegex.exec(htmlContent)) !== null) {
      elements.push({
        type: 'paragraph',
        content: pMatch[1].trim(),
        position: pMatch.index
      });
    }
    
    // Extraire les images avec leur position
    const imgRegex = /<figure>\s*<img src="([^"]*)" alt="([^"]*)" \/>\s*<figcaption>([\s\S]*?)<\/figcaption>\s*<\/figure>/g;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(htmlContent)) !== null) {
      elements.push({
        type: 'image',
        url: imgMatch[1],
        alt: imgMatch[2],
        content: imgMatch[3].trim(),
        position: imgMatch.index
      });
    }
    
    // Extraire les vidéos avec leur position
    const videoRegex = /<figure class="video">\s*<(?:iframe|video)[^>]*src="([^"]*)"[^>]*><\/(?:iframe|video)>\s*<figcaption>([\s\S]*?)<\/figcaption>\s*<\/figure>/g;
    let videoMatch;
    while ((videoMatch = videoRegex.exec(htmlContent)) !== null) {
      elements.push({
        type: 'video',
        url: videoMatch[1],
        content: videoMatch[2].trim(),
        position: videoMatch.index
      });
    }
    
    // Extraire les listes avec leur position
    const listRegex = /<ul>\s*([\s\S]*?)\s*<\/ul>/g;
    let listMatch;
    while ((listMatch = listRegex.exec(htmlContent)) !== null) {
      const listContent = listMatch[1];
      const listItemRegex = /<li>([\s\S]*?)<\/li>/g;
      const listItems: string[] = [];
      let listItemMatch;
      
      while ((listItemMatch = listItemRegex.exec(listContent)) !== null) {
        listItems.push(listItemMatch[1].trim());
      }
      
      if (listItems.length > 0) {
        elements.push({
          type: 'list',
          content: '',
          listItems,
          position: listMatch.index
        });
      }
    }
    
    // Trier les éléments par position pour préserver l'ordre original
    elements.sort((a, b) => a.position - b.position);
    
    console.log('Elements sorted by position:', 
      elements.map(e => ({
        type: e.type,
        content: e.content?.substring(0, 20) + (e.content?.length > 20 ? '...' : ''),
        position: e.position
      }))
    );
    
    // Convertir les éléments triés en ContentElement et les ajouter à la section
    elements.forEach(element => {
      section.elements.push({
        id: uuidv4(),
        type: element.type,
        content: element.content,
        url: element.url,
        alt: element.alt,
        listItems: element.listItems
      });
    });
    
    console.log('Final section elements:', 
      section.elements.map(e => ({
        type: e.type,
        content: e.content?.substring(0, 20) + (e.content?.length > 20 ? '...' : '')
      }))
    );
  }, []);
  
  // Créer une structure à partir du contenu HTML
  const createStructureFromHTML = useCallback((htmlContent: string): ContentSection[] => {
    console.log('Converting HTML to structure:', htmlContent.substring(0, 100) + '...');
    
    // Créer une section par défaut
    const section: ContentSection = {
      id: uuidv4(),
      elements: []
    };
    
    // Essayer de détecter les sections dans le HTML
    const sectionMatches = htmlContent.match(/<section>([\s\S]*?)<\/section>/g);
    
    if (sectionMatches && sectionMatches.length > 0) {
      // Créer une section pour chaque balise <section> trouvée
      return sectionMatches.map(sectionHTML => {
        const section: ContentSection = {
          id: uuidv4(),
          elements: []
        };
        
        // Extraire le contenu de la section
        const sectionContent = sectionHTML.replace(/<section>([\s\S]*?)<\/section>/, '$1').trim();
        
        // Analyser le contenu de la section pour extraire les éléments dans leur ordre d'apparition
        extractElementsInOrder(sectionContent, section);
        
        return section;
      });
    } else {
      // Pas de section trouvée, créer une section avec tout le contenu
      // Extraire les éléments dans leur ordre d'apparition
      extractElementsInOrder(htmlContent, section);
      
      // Si aucun élément n'a été trouvé, ajouter tout le contenu comme paragraphe
      if (section.elements.length === 0) {
        section.elements.push({
          id: uuidv4(),
          type: 'paragraph',
          content: htmlContent
        });
      }
      
      return [section];
    }
  }, [extractElementsInOrder]);
  
  // Fonction pour extraire l'ID YouTube d'une URL
  const extractYouTubeId = useCallback((url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : ''
  }, [])
  
  // Générer un contenu texte brut à partir des sections structurées
  const generateRawContent = useCallback((sectionsArray: ContentSection[], options?: { onlySections?: boolean, postData?: any }): string => {
    // Générer le contenu HTML des sections
    const sectionsContent = sectionsArray.map(section => {
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
    
    // Si on a demandé uniquement les sections, les retourner directement
    if (options?.onlySections) {
      return sectionsContent
    }
    
    // Extraire les données du post pour les métadonnées si disponibles
    const postData = options?.postData || {}
    const title = postData.title || 'Article de blog'
    const description = postData.metaDescription || postData.excerpt || ''
    const authorName = postData.author || ''
    const mainImageUrl = postData.mainImageUrl || ''
    const mainImageAlt = postData.mainImageAlt || ''
    const mainImageCaption = postData.mainImageCaption || ''
    const introText = postData.introText || ''
    
    // Générer la page HTML complète pour l'aperçu
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    ${authorName ? `<meta name="author" content="${authorName}">` : ''}
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    ${mainImageUrl ? `<meta property="og:image" content="${mainImageUrl}">` : ''}
    <meta property="og:type" content="article">
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 0.5em;
        }
        h2 {
            font-size: 1.8em;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        h3 {
            font-size: 1.4em;
            margin-top: 1.2em;
            margin-bottom: 0.5em;
        }
        p {
            margin-bottom: 1em;
        }
        figure {
            margin: 2em 0;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        figcaption {
            text-align: center;
            font-style: italic;
            margin-top: 0.5em;
            color: #666;
        }
        .article-meta {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 2em;
        }
        .article-intro {
            font-size: 1.1em;
            line-height: 1.8;
            margin-bottom: 2em;
        }
        .main-image {
            margin: 2em 0;
        }
    </style>
</head>
<body>
    <article>
        <header>
            <h1>${title}</h1>
            <div class="article-meta">
                ${authorName ? `<span class="author">Par ${authorName}</span>` : ''}
            </div>
            ${mainImageUrl ? 
                `<figure class="main-image">
                    <img src="${mainImageUrl}" alt="${mainImageAlt}" />
                    ${mainImageCaption ? `<figcaption>${mainImageCaption}</figcaption>` : ''}
                </figure>` : ''
            }
            ${introText ? `<div class="article-intro">${introText}</div>` : ''}
        </header>
        <div class="article-content">
${sectionsContent}
        </div>
    </article>
</body>
</html>`
  }, [extractYouTubeId])
  
  // Fonction pour collecter les données du DOM et notifier le parent
  const collectDataAndNotify = useCallback(() => {
    console.log('Début de collecte des données depuis le DOM');
    const updatedSections = [...dataRef.current.sections]
    
    // Parcourir toutes les sections et leurs éléments pour récupérer les valeurs du DOM
    updatedSections.forEach(section => {
      section.elements.forEach(element => {
        // Récupérer les valeurs selon le type d'élément
        if (element.type === 'h2' || element.type === 'h3') {
          const input = document.getElementById(`${element.type}-${element.id}`) as HTMLInputElement
          if (input) {
            const oldValue = element.content;
            element.content = input.value;
            console.log(`Élément ${element.type} mis à jour:`, {
              id: element.id,
              ancienneValeur: oldValue,
              nouvelleValeur: input.value,
              inputId: `${element.type}-${element.id}`,
              inputTrouvé: !!input
            });
          } else {
            console.warn(`Input non trouvé pour élément ${element.type} avec ID ${element.id}`);
          }
        } else if (element.type === 'paragraph') {
          const textarea = document.getElementById(`paragraph-${element.id}`) as HTMLTextAreaElement
          if (textarea) {
            const oldValue = element.content;
            element.content = textarea.value;
            console.log(`Élément paragraph mis à jour:`, {
              id: element.id,
              ancienneValeur: oldValue.substring(0, 20) + (oldValue.length > 20 ? '...' : ''),
              nouvelleValeur: textarea.value.substring(0, 20) + (textarea.value.length > 20 ? '...' : ''),
              textareaId: `paragraph-${element.id}`,
              textareaTrouvé: !!textarea
            });
          } else {
            console.warn(`Textarea non trouvé pour paragraph avec ID ${element.id}`);
          }
        } else if (element.type === 'image' || element.type === 'video') {
          const urlInput = document.getElementById(`${element.type}-url-${element.id}`) as HTMLInputElement
          const captionInput = document.getElementById(`${element.type}-caption-${element.id}`) as HTMLInputElement
          if (urlInput) element.url = urlInput.value
          if (captionInput) element.content = captionInput.value
          
          if (element.type === 'image') {
            const altInput = document.getElementById(`image-alt-${element.id}`) as HTMLInputElement
            if (altInput) element.alt = altInput.value
          }
        } else if (element.type === 'list') {
          // Récupérer tous les items de liste par leur index
          const listItems: string[] = []
          let index = 0
          let itemInput = document.getElementById(`list-item-${element.id}-${index}`) as HTMLInputElement
          
          while (itemInput) {
            listItems.push(itemInput.value)
            index++
            itemInput = document.getElementById(`list-item-${element.id}-${index}`) as HTMLInputElement
          }
          
          if (listItems.length > 0) {
            element.listItems = listItems
          }
        }
      })
    })
    
    // Vérifier s'il y a au moins une section avec des éléments
    let hasContent = false;
    for (const section of updatedSections) {
      if (section.elements.length > 0) {
        hasContent = true;
        break;
      }
    }
    
    // Si aucun contenu n'est trouvé, créer une section vide par défaut
    if (!hasContent && updatedSections.length === 0) {
      updatedSections.push(createEmptySection());
      console.log('Aucun contenu trouvé, création d\'une section vide par défaut');
    }
    
    // Mettre à jour la référence avec les nouvelles données
    dataRef.current.sections = updatedSections
    
    // Pour l'éditeur, on génère uniquement le contenu des sections
    // car le HTML complet sera généré côté serveur avec les données complètes
    const jsonContent = JSON.stringify(updatedSections)
    const rawContent = generateRawContent(updatedSections, { onlySections: true })
    
    console.log('Données collectées:', {
      sections: updatedSections.length,
      elementsJSON: jsonContent.substring(0, 100) + '...',
      htmlGeneré: rawContent.substring(0, 100) + '...'
    });
    
    // Notifier le parent avec les nouvelles données
    onChange(jsonContent, rawContent)
    
    return updatedSections
  }, [onChange, createEmptySection, generateRawContent])
  
  // Exposer la fonction de collecte pour l'utiliser depuis l'extérieur (BlogPostForm)
  useEffect(() => {
    // Exposer la fonction de synchronisation pour accès global
    console.log('Exposant la fonction syncBlogEditorContent au niveau global');
    // @ts-ignore
    window.syncBlogEditorContent = collectDataAndNotify
    
    return () => {
      console.log('Nettoyage de la fonction syncBlogEditorContent');
      // @ts-ignore
      delete window.syncBlogEditorContent
    }
  }, [collectDataAndNotify])
  
  // Initialiser le contenu une seule fois ou quand initialContent change
  useEffect(() => {
    if (dataRef.current.isInitialized && !initialContent) return
    
    console.log('BlogContentEditor initialContent:', initialContent);
    console.log('Type of initialContent:', typeof initialContent);
    
    if (typeof initialContent === 'object') {
      console.log('initialContent is already an object, structure:', 
        Array.isArray(initialContent) ? 'array' : 'object',
        'length:', Array.isArray(initialContent) ? initialContent.length : 'N/A');
      
      // Vérification détaillée de la structure
      if (Array.isArray(initialContent)) {
        // Log plus détaillé pour déboguer
        initialContent.forEach((section, sectionIndex) => {
          console.log(`Section ${sectionIndex + 1} ID:`, section.id);
          console.log(`Section ${sectionIndex + 1} a ${section.elements?.length || 0} éléments`);
          
          if (section.elements && Array.isArray(section.elements)) {
            section.elements.forEach((element, elementIndex) => {
              console.log(`  - Élément ${elementIndex + 1} type:`, element.type);
              console.log(`    Content:`, element.content ? element.content.substring(0, 30) : 'vide');
              
              if (element.type === 'image') {
                console.log(`    Image URL:`, element.url || 'Non définie');
                console.log(`    Image Alt:`, element.alt || 'Non défini');
              } else if (element.type === 'video') {
                console.log(`    Video URL:`, element.url || 'Non définie');
              } else if (element.type === 'list') {
                console.log(`    List items:`, element.listItems?.length || 0, 'éléments');
              }
            });
          }
        });
      }
    }
    
    try {
      if (initialContent) {
        // Vérifier si le contenu est déjà un objet structuré (déjà parsé) ou une chaîne JSON
        let parsedContent;
        
        if (typeof initialContent === 'string') {
          // Si c'est un HTML, on le détecte avec des marqueurs comme <h2>, <p>, etc.
          if (initialContent.includes('<h2>') || 
              initialContent.includes('<p>') || 
              initialContent.includes('<section>') ||
              initialContent.includes('<figure>') ||
              initialContent.includes('<ul>')) {
            console.log('Content appears to be HTML, converting to structure');
            // Convertir le HTML en structure
            parsedContent = createStructureFromHTML(initialContent);
            console.log('Created structure from HTML:', parsedContent);
          } else {
            // Tenter de parser la chaîne JSON
            console.log('Attempting to parse string as JSON');
            parsedContent = JSON.parse(initialContent) as StructuredContent;
            console.log('Successfully parsed JSON string');
          }
        } else if (Array.isArray(initialContent)) {
          // C'est déjà un tableau d'objets (déjà parsé)
          console.log('Using provided array structure directly');
          parsedContent = initialContent as StructuredContent;
        }
        
        if (Array.isArray(parsedContent) && parsedContent.length > 0) {
          // Vérifier le format attendu
          let isValid = true;
          let missingElements = [];
          
          for (const section of parsedContent) {
            if (!section.id || !Array.isArray(section.elements)) {
              isValid = false;
              missingElements.push('section.id or section.elements missing');
              console.log('Invalid section found:', section);
              break;
            }
            
            // Vérifier chaque élément de la section
            for (const element of section.elements) {
              if (!element.id || !element.type) {
                isValid = false;
                missingElements.push(`missing element id or type: ${JSON.stringify(element)}`);
                break;
              }
            }
          }
          
          if (isValid) {
            console.log('Valid structure detected, initializing editor with structured content');
            dataRef.current.sections = parsedContent;
            dataRef.current.isInitialized = true;
            forceUpdate(prev => prev + 1); // Force un re-render
            return;
          } else {
            console.log('Invalid format. Missing elements:', missingElements);
          }
        } else {
          console.log('Parsed content is not a valid array or is empty');
        }
      }
    } catch (e) {
      console.error('Error when parsing the content:', e);
      
      // Si le contenu semble être du HTML, essayons de le convertir en structure
      if (typeof initialContent === 'string' && 
          (initialContent.includes('<h2>') || 
           initialContent.includes('<p>') || 
           initialContent.includes('<section>') ||
           initialContent.includes('<figure>') ||
           initialContent.includes('<ul>'))) {
        console.log('Exception when parsing, but content contains HTML tags, attempting to convert HTML to structure');
        
        // Créer une structure à partir du HTML
        const sections = createStructureFromHTML(initialContent);
        
        if (sections.length > 0) {
          console.log('Successfully created structure from HTML content');
          dataRef.current.sections = sections;
          dataRef.current.isInitialized = true;
          forceUpdate(prev => prev + 1);
          return;
        }
      }
    }
    
    // Fallback: créer une section vide ou avec contenu comme paragraphe
    console.log('Using fallback: creating empty section');
    const initialSection = createEmptySection()
    if (initialContent && typeof initialContent === 'string' && initialContent.trim() && !initialContent.startsWith('[')) {
      initialSection.elements.push({
        id: uuidv4(),
        type: 'paragraph',
        content: initialContent
      })
    }
    dataRef.current.sections = [initialSection]
    dataRef.current.isInitialized = true
    forceUpdate(prev => prev + 1)
  }, [initialContent, createEmptySection, createStructureFromHTML])
  
  // Actions qui modifient la structure (nécessitent un re-render)
  
  // Ajouter une nouvelle section
  const addSection = () => {
    dataRef.current.sections.push(createEmptySection())
    forceUpdate(prev => prev + 1)
  }
  
  // Supprimer une section
  const removeSection = (sectionId: string) => {
    dataRef.current.sections = dataRef.current.sections.filter(section => section.id !== sectionId)
    forceUpdate(prev => prev + 1)
  }
  
  // Ajouter un élément à une section
  const addElement = (sectionId: string, type: ContentElementType) => {
    const sectionIndex = dataRef.current.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex !== -1) {
      dataRef.current.sections[sectionIndex].elements.push(createEmptyElement(type))
      forceUpdate(prev => prev + 1)
    }
  }
  
  // Supprimer un élément
  const removeElement = (sectionId: string, elementId: string) => {
    const sectionIndex = dataRef.current.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex !== -1) {
      dataRef.current.sections[sectionIndex].elements = 
        dataRef.current.sections[sectionIndex].elements.filter(el => el.id !== elementId)
      forceUpdate(prev => prev + 1)
    }
  }
  
  // Ajouter un item à une liste
  const addListItem = (sectionId: string, elementId: string) => {
    const sectionIndex = dataRef.current.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex !== -1) {
      const elementIndex = dataRef.current.sections[sectionIndex].elements.findIndex(el => el.id === elementId)
      if (elementIndex !== -1) {
        const element = dataRef.current.sections[sectionIndex].elements[elementIndex]
        if (element.type === 'list') {
          if (!element.listItems) element.listItems = []
          element.listItems.push('')
          forceUpdate(prev => prev + 1)
        }
      }
    }
  }
  
  // Supprimer un item de liste
  const removeListItem = (sectionId: string, elementId: string, itemIndex: number) => {
    const sectionIndex = dataRef.current.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex !== -1) {
      const elementIndex = dataRef.current.sections[sectionIndex].elements.findIndex(el => el.id === elementId)
      if (elementIndex !== -1) {
        const element = dataRef.current.sections[sectionIndex].elements[elementIndex]
        if (element.type === 'list' && element.listItems && element.listItems.length > 1) {
          element.listItems.splice(itemIndex, 1)
          forceUpdate(prev => prev + 1)
        }
      }
    }
  }
  
  // Déplacer un élément vers le haut
  const moveElementUp = (sectionId: string, index: number) => {
    if (index <= 0) return
    
    const sectionIndex = dataRef.current.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex !== -1) {
      const elements = dataRef.current.sections[sectionIndex].elements
      const temp = elements[index]
      elements[index] = elements[index - 1]
      elements[index - 1] = temp
      forceUpdate(prev => prev + 1)
    }
  }
  
  // Déplacer un élément vers le bas
  const moveElementDown = (sectionId: string, index: number) => {
    const sectionIndex = dataRef.current.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex !== -1) {
      const elements = dataRef.current.sections[sectionIndex].elements
      if (index >= elements.length - 1) return
      
      const temp = elements[index]
      elements[index] = elements[index + 1]
      elements[index + 1] = temp
      forceUpdate(prev => prev + 1)
    }
  }
  
  // Déplacer une section vers le haut
  const moveSectionUp = (index: number) => {
    if (index <= 0) return
    
    const sections = dataRef.current.sections
    const temp = sections[index]
    sections[index] = sections[index - 1]
    sections[index - 1] = temp
    forceUpdate(prev => prev + 1)
  }
  
  // Déplacer une section vers le bas
  const moveSectionDown = (index: number) => {
    const sections = dataRef.current.sections
    if (index >= sections.length - 1) return
    
    const temp = sections[index]
    sections[index] = sections[index + 1]
    sections[index + 1] = temp
    forceUpdate(prev => prev + 1)
  }
  
  // Si l'initialisation n'est pas encore terminée, afficher un indicateur de chargement
  if (!dataRef.current.isInitialized) {
    return <div className="py-4 text-center">Chargement de l'éditeur...</div>
  }
  
  return (
    <div className="space-y-4">
      {/* Bouton pour ajouter une section */}
      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="w-full py-6 border-dashed border-violet-200 bg-violet-50/50 hover:bg-violet-100/50 text-violet-700 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700 dark:text-slate-300"
      >
        <PlusCircle className="h-5 w-5 mr-2" />
        Add a new section
      </Button>
      
      {/* Liste des sections */}
      <TooltipProvider>
        {dataRef.current.sections.map((section, sectionIndex) => (
          <Card key={section.id} className="border border-violet-200 shadow-sm dark:border-slate-700 dark:shadow-slate-800/10">
            <CardHeader className="bg-violet-50 flex flex-row items-center justify-between p-4 dark:bg-slate-800/40">
              <CardTitle className="text-lg font-medium text-violet-800 dark:text-violet-300">
                Section {sectionIndex + 1}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveSectionUp(sectionIndex)}
                  disabled={sectionIndex === 0}
                  className="dark:bg-violet-900/50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-800"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveSectionDown(sectionIndex)}
                  disabled={sectionIndex === dataRef.current.sections.length - 1}
                  className="dark:bg-violet-900/50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-800"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeSection(section.id)}
                  disabled={dataRef.current.sections.length === 1}
                  className="dark:bg-violet-900/50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4 bg-violet-50/30 dark:bg-slate-900/60">
              {section.elements.map((element, elementIndex) => (
                <div 
                  key={element.id} 
                  className={`border rounded-md p-4 space-y-3 ${
                    element.type === 'h2' ? 'bg-pink-50 border-pink-200 dark:bg-slate-800 dark:border-slate-700' : 
                    element.type === 'h3' ? 'bg-pink-100/70 border-pink-200 dark:bg-slate-800 dark:border-slate-700' : 
                    element.type === 'paragraph' ? 'bg-white border-pink-100 dark:bg-slate-800 dark:border-slate-700' : 
                    element.type === 'image' ? 'bg-violet-50 border-violet-200 dark:bg-slate-800 dark:border-slate-700' : 
                    element.type === 'video' ? 'bg-violet-100/70 border-violet-200 dark:bg-slate-800 dark:border-slate-700' : 
                    element.type === 'list' ? 'bg-pink-50/70 border-pink-100 dark:bg-slate-800 dark:border-slate-700' : 
                    'bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`text-sm font-medium p-1 px-2 rounded ${
                        element.type === 'h2' ? 'bg-pink-200 text-pink-800 dark:bg-slate-700 dark:text-slate-200' : 
                        element.type === 'h3' ? 'bg-pink-300 text-pink-900 dark:bg-slate-700 dark:text-slate-200' : 
                        element.type === 'paragraph' ? 'bg-pink-100 text-pink-800 dark:bg-slate-700 dark:text-slate-200' : 
                        element.type === 'image' ? 'bg-violet-200 text-violet-800 dark:bg-slate-700 dark:text-slate-200' : 
                        element.type === 'video' ? 'bg-violet-300 text-violet-900 dark:bg-slate-700 dark:text-slate-200' : 
                        element.type === 'list' ? 'bg-pink-200 text-pink-900 dark:bg-slate-700 dark:text-slate-200' : 
                        'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200'
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
                      <Input 
                        id={`h2-${element.id}`}
                        defaultValue={element.content}
                        placeholder="Main title"
                        className="border-pink-200 focus:border-pink-300 focus:ring-pink-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50 dark:placeholder-slate-400"
                      />
                    </div>
                  )}
                  
                  {element.type === 'h3' && (
                    <div className="space-y-1">
                      <Input 
                        id={`h3-${element.id}`}
                        defaultValue={element.content}
                        placeholder="Subtitle"
                        className="border-pink-200 focus:border-pink-300 focus:ring-pink-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50 dark:placeholder-slate-400"
                      />
                    </div>
                  )}
                  
                  {element.type === 'paragraph' && (
                    <div className="space-y-1">
                      <Textarea 
                        id={`paragraph-${element.id}`}
                        defaultValue={element.content}
                        placeholder="Paragraph content ..."
                        className="min-h-[100px] border-pink-100 focus:border-pink-200 focus:ring-pink-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50 dark:placeholder-slate-400"
                      />
                    </div>
                  )}
                  
                  {element.type === 'image' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor={`image-url-${element.id}`} className="text-violet-800 dark:text-slate-300">Image URL</Label>
                        <Input 
                          id={`image-url-${element.id}`}
                          defaultValue={element.url || ''}
                          placeholder="https://example.com/image.jpg"
                          className="border-violet-200 focus:border-violet-300 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50 dark:placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`image-alt-${element.id}`} className="text-violet-800 dark:text-slate-300">Alternatif Text</Label>
                        <Input 
                          id={`image-alt-${element.id}`}
                          defaultValue={element.alt || ''}
                          placeholder="Image description"
                          className="border-violet-200 focus:border-violet-300 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50 dark:placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`image-caption-${element.id}`} className="text-violet-800 dark:text-slate-300">Caption</Label>
                        <Input 
                          id={`image-caption-${element.id}`}
                          defaultValue={element.content}
                          placeholder="Image caption"
                          className="border-violet-200 focus:border-violet-300 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50 dark:placeholder-slate-400"
                        />
                      </div>
                    </div>
                  )}
                  
                  {element.type === 'video' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor={`video-url-${element.id}`} className="text-violet-900 dark:text-slate-300">Video URL</Label>
                        <Input 
                          id={`video-url-${element.id}`}
                          defaultValue={element.url || ''}
                          placeholder="https://example.com/video.mp4 ou ID YouTube"
                          className="border-violet-300 focus:border-violet-400 focus:ring-violet-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50 dark:placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`video-caption-${element.id}`} className="text-violet-900 dark:text-slate-300">Caption</Label>
                        <Input 
                          id={`video-caption-${element.id}`}
                          defaultValue={element.content}
                          placeholder="Video caption"
                          className="border-violet-300 focus:border-violet-400 focus:ring-violet-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50 dark:placeholder-slate-400"
                        />
                      </div>
                    </div>
                  )}
                  
                  {element.type === 'list' && (
                    <div className="space-y-3">
                      <Label className="text-pink-800 dark:text-slate-300">List items</Label>
                      {element.listItems?.map((item, itemIndex) => (
                        <div key={`${element.id}-item-${itemIndex}`} className="flex items-center space-x-2">
                          <span className="text-pink-500 dark:text-slate-400">•</span>
                          <Input 
                            id={`list-item-${element.id}-${itemIndex}`}
                            defaultValue={item}
                            placeholder={`Item ${itemIndex + 1}`}
                            className="flex-1 border-pink-100 focus:border-pink-200 focus:ring-pink-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50 dark:placeholder-slate-400"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeListItem(section.id, element.id, itemIndex)}
                            disabled={(element.listItems?.length || 0) <= 1}
                            className="text-pink-700 hover:bg-pink-100 dark:text-slate-400 dark:hover:bg-slate-700"
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
                        className="mt-2 border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        Add an item
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              
              {section.elements.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-violet-50/50 border border-dashed border-violet-200 rounded-lg dark:bg-slate-800/50 dark:border-slate-700 dark:text-gray-400">
                  No elements in this section. Add elements using the buttons below.
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t border-violet-100 bg-violet-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <ActionTooltip label="Add a main title for the section">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement(section.id, 'h2')}
                    className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    <Type className="h-4 w-4 mr-2" /> H2
                  </Button>
                </ActionTooltip>
                
                <ActionTooltip label="Add a subtitle for the section">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement(section.id, 'h3')}
                    className="bg-pink-100/70 border-pink-200 text-pink-800 hover:bg-pink-200/70 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    <Type className="h-4 w-4 mr-2" /> H3
                  </Button>
                </ActionTooltip>
                
                <ActionTooltip label="Add a paragraph">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement(section.id, 'paragraph')}
                    className="bg-white border-pink-100 text-pink-700 hover:bg-pink-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    <PenSquare className="h-4 w-4 mr-2" /> Paragraph
                  </Button>
                </ActionTooltip>
                
                <ActionTooltip label="Add an image">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement(section.id, 'image')}
                    className="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    <Image className="h-4 w-4 mr-2" /> Image
                  </Button>
                </ActionTooltip>
                
                <ActionTooltip label="Add a video">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement(section.id, 'video')}
                    className="bg-violet-100/70 border-violet-200 text-violet-800 hover:bg-violet-200/70 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    <Play className="h-4 w-4 mr-2" /> Video
                  </Button>
                </ActionTooltip>
                
                <ActionTooltip label="Add a list">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addElement(section.id, 'list')}
                    className="bg-pink-50/70 border-pink-100 text-pink-700 hover:bg-pink-100/70 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    <List className="h-4 w-4 mr-2" /> List
                  </Button>
                </ActionTooltip>
              </div>
            </CardFooter>
          </Card>
        ))}
      </TooltipProvider>
      
      {dataRef.current.sections.length === 0 && (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-lg dark:border-slate-700 dark:text-slate-300">
          <p className="text-gray-500 mb-4 dark:text-slate-400">No sections yet. Add your first section to start.</p>
          <Button
            type="button"
            variant="default"
            onClick={addSection}
            className="bg-violet-600 hover:bg-violet-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add first section
          </Button>
        </div>
      )}
    </div>
  )
} 
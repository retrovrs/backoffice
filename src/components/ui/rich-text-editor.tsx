'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  initialValue?: string
  placeholder?: string
  onChange?: (content: string) => void
  className?: string
  minHeight?: string
}

export function RichTextEditor({
  initialValue = '',
  placeholder = 'Tapez votre contenu...',
  onChange,
  className,
  minHeight = '100px'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isBoldActive, setIsBoldActive] = useState(false)
  const [isItalicActive, setIsItalicActive] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  // Initialiser le contenu
  useEffect(() => {
    if (editorRef.current && initialValue) {
      // Convertir le texte simple en HTML si nécessaire
      const htmlContent = initialValue.includes('<') ? initialValue : initialValue.replace(/\n/g, '<br>')
      editorRef.current.innerHTML = htmlContent
    }
  }, [initialValue])

  // Mettre à jour l'état des boutons de formatting
  const updateFormattingState = useCallback(() => {
    if (!document.getSelection) return

    const selection = document.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Vérifier si le texte sélectionné est en bold
    const isBold = document.queryCommandState('bold')
    const isItalic = document.queryCommandState('italic')
    
    setIsBoldActive(isBold)
    setIsItalicActive(isItalic)
  }, [])

  // Gérer la sélection de texte
  const handleSelectionChange = useCallback(() => {
    updateFormattingState()
  }, [updateFormattingState])

  // Écouter les changements de sélection
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  // Appliquer le formatting bold
  const toggleBold = useCallback(() => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    document.execCommand('bold', false, undefined)
    updateFormattingState()
    
    // Notifier le changement
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange, updateFormattingState])

  // Appliquer le formatting italic
  const toggleItalic = useCallback(() => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    document.execCommand('italic', false, undefined)
    updateFormattingState()
    
    // Notifier le changement
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange, updateFormattingState])

  // Gérer les changements de contenu
  const handleInput = useCallback(() => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
    updateFormattingState()
  }, [onChange, updateFormattingState])

  // Gérer le focus
  const handleFocus = useCallback(() => {
    setIsFocused(true)
    updateFormattingState()
  }, [updateFormattingState])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  // Gérer les raccourcis clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b') {
        e.preventDefault()
        toggleBold()
      } else if (e.key === 'i') {
        e.preventDefault()
        toggleItalic()
      }
    }
  }, [toggleBold, toggleItalic])

  const hasSelection = () => {
    const selection = window.getSelection()
    return selection && selection.toString().length > 0
  }

  return (
    <div className={cn('border rounded-md', className)}>
      {/* Barre d'outils */}
      <div className={cn(
        'flex items-center gap-1 p-2 border-b bg-muted/30 transition-opacity',
        !isFocused && !hasSelection() ? 'opacity-50' : 'opacity-100'
      )}>
        <Button
          type="button"
          variant={isBoldActive ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleBold}
          className={cn(
            'h-8 w-8 p-0',
            isBoldActive && 'bg-primary text-primary-foreground'
          )}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={isItalicActive ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleItalic}
          className={cn(
            'h-8 w-8 p-0',
            isItalicActive && 'bg-primary text-primary-foreground'
          )}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <div className="ml-auto text-xs text-muted-foreground">
          Sélectionnez du texte pour le formater
        </div>
      </div>

      {/* Zone d'édition */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          'p-3 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-b-md',
          'prose prose-sm max-w-none',
          '[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic',
          className
        )}
        style={{ minHeight }}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      
      {/* Afficher le placeholder si vide */}
      <style jsx>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

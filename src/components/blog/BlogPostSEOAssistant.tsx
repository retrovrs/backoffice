'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { BlogPostFormValues } from '@/types/blog'
import { Badge } from '@/components/ui/badge'
import { CircleOff, CircleCheck, AlertCircle } from 'lucide-react'

interface BlogPostSEOAssistantProps {
  formData: BlogPostFormValues
  disabled?: boolean
}

// Fonction pour obtenir la couleur associée à une catégorie
function getCategoryColor(category: string): { bg: string, text: string, border: string } {
  // Par défaut
  let bg = '#9C27B0'; // Violet
  let text = '#FFFFFF';
  let border = '#7B1FA2';

  // Couleurs selon la catégorie (convertir en minuscules pour faciliter la comparaison)
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('provenance')) {
    bg = '#6A1B9A'; // Violet très foncé
    text = '#FFFFFF';
    border = '#4A148C';
  } else if (categoryLower.includes('blog') || categoryLower === 'blog') {
    bg = '#00796B'; // Vert teal foncé
    text = '#FFFFFF';
    border = '#004D40';
  } else if (categoryLower.includes('news') || categoryLower.includes('actualité')) {
    bg = '#D81B60'; // Fuchsia/magenta
    text = '#FFFFFF';
    border = '#AD1457';
  } else if (categoryLower.includes('guide') || categoryLower.includes('tutorial')) {
    bg = '#F57F17'; // Jaune orangé
    text = '#000000';
    border = '#E65100';
  }

  return { bg, text, border };
}

// Composant séparé pour le contenu de l'assistant SEO
export function BlogPostSEOAssistantContent({ formData, disabled = false }: BlogPostSEOAssistantProps) {
  const seoScore = getScorePercentage(formData)
  
  return (
    <Tabs defaultValue="preview" className="w-full">
      {/* Style pour charger Bebas Neue pour l'aperçu */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;500&display=swap');
      `}</style>
      
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="html">Generated HTML</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="analyzer">SEO Analyzer</TabsTrigger>
      </TabsList>
      
      <TabsContent value="html" className="space-y-4">
        <div className="bg-muted p-4 rounded-lg overflow-x-auto w-full h-[60vh]">
          <pre className="text-sm whitespace-pre-wrap w-full">
            {`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.title || 'Article Title'} - RetroVrs</title>
  <meta name="description" content="${formData.excerpt || 'Article summary...'}">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
  
  <!-- Open Graph Meta for social networks -->
  <meta property="og:title" content="${formData.title || 'Article Title'}">
  <meta property="og:description" content="${formData.excerpt || 'Article summary...'}">
  <meta property="og:image" content="${formData.mainImageUrl || 'Main image URL'}">
  <meta property="og:url" content="https://retrovrs.com/blog/${formData.slug || 'article-url'}">
  <meta property="og:type" content="article">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${formData.title || 'Article Title'}">
  <meta name="twitter:description" content="${formData.excerpt || 'Article summary...'}">
  <meta name="twitter:image" content="${formData.mainImageUrl || 'Main image URL'}">
  
  <!-- Canonical tag (prevents duplicate content) -->
  <link rel="canonical" href="https://retrovrs.com/blog/${formData.slug || 'article-url'}">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <article>
    <!-- Article header -->
    <header>
      <h1 style="font-family: 'Bebas Neue Bold', 'Impact', sans-serif; text-transform: uppercase; letter-spacing: 1px;">${formData.title || 'Article Title'}</h1>
      <div class="meta" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-family: 'Poppins', sans-serif; font-weight: 500;">By ${formData.authorLink 
             ? `<a href="${formData.authorLink}" style="text-decoration: none; color: inherit;">${formData.author || 'Author'}</a>` 
             : formData.author || 'Author'}</span>
          <time datetime="${formData.publishDate || new Date().toISOString().split('T')[0]}" style="font-family: 'Poppins', sans-serif; opacity: 0.8; font-size: 0.9em;">${new Date(formData.publishDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        </div>
        ${formData.category ? (() => {
          const categoryColors = getCategoryColor(formData.category);
          return `<span style="display: inline-block; background-color: ${categoryColors.bg}; color: ${categoryColors.text}; border: 1px solid ${categoryColors.border}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-family: 'Poppins', sans-serif; font-size: 0.875rem; font-weight: 500;">${formData.category}</span>`;
        })() : ''}
      </div>
    </header>
    
    <!-- Introduction -->
    <p class="lead" style="font-family: 'Poppins', sans-serif; font-weight: 400;">${formData.introText || formData.excerpt || 'Article summary...'}</p>
    
    <!-- Main image -->
    <figure>
      <img 
        src="${formData.mainImageUrl || 'https://placeholder.com/800x500'}" 
        alt="${formData.mainImageAlt || 'Image illustrating ' + formData.title}" 
        title="${formData.title}"
        width="800" 
        height="500" 
        loading="lazy">
      <figcaption>${formData.mainImageCaption || 'Image illustrating the article'}</figcaption>
    </figure>
    
    <!-- Article content -->
    ${(formData.content || 'Article content...')
      .replace(/<h2>/g, '<h2 style="font-family: \'Bebas Neue Bold\', \'Impact\', sans-serif; text-transform: uppercase; letter-spacing: 1px;">')
      .replace(/<h3>/g, '<h3 style="font-family: \'Bebas Neue Bold\', \'Impact\', sans-serif; text-transform: uppercase; letter-spacing: 1px;">')
      .replace(/<p>/g, '<p style="font-family: \'Poppins\', sans-serif; font-weight: 400;">')
      .replace(/<ul>/g, '<ul style="font-family: \'Poppins\', sans-serif; font-weight: 400;">')
      .replace(/<ol>/g, '<ol style="font-family: \'Poppins\', sans-serif; font-weight: 400;">')
      .replace(/<li>/g, '<li style="font-family: \'Poppins\', sans-serif; font-weight: 400;">')}
    
    ${formData.tags && formData.tags.trim() !== '' ? `
    <!-- Tags -->
    <footer>
      <section class="tags" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eaeaea;">
        <h2 style="font-size: 1.25rem; margin-bottom: 0.75rem;">Tags</h2>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.25rem;">
          ${formData.tags.split(',').map(tag => {
            const tagText = tag.trim();
            if (!tagText) return '';
            const tagSlug = tagText.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
            return `<li><a href="/tags/${tagSlug}" rel="tag" style="display: inline-block; background-color: #f0f0f0; color: #333; font-size: 0.875rem; padding: 0.25rem 0.75rem; margin: 0.25rem; border-radius: 9999px; text-decoration: none; transition: background-color 0.2s, color 0.2s; border: 1px solid #ddd; font-weight: 500;">${tagText}</a></li>`;
          }).join('\n          ')}
        </ul>
      </section>
    </footer>` : ''}
    
    <!-- Schema.org structured data for search engines -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "${formData.title || 'Article Title'}",
      "image": "${formData.mainImageUrl || 'Main image URL'}",
      "datePublished": "${formData.publishDate || new Date().toISOString()}",
      "dateModified": "${new Date().toISOString()}",
      "author": {
        "@type": "Person",
        "name": "${formData.author || 'Author Name'}"${formData.authorLink ? `,\n        "url": "${formData.authorLink}"` : ''}
      },
      "publisher": {
        "@type": "Organization",
        "name": "RetroVrs",
        "logo": {
          "@type": "ImageObject",
          "url": "Logo URL"
        }
      },
      "description": "${formData.excerpt || 'Article summary...'}"
    }
    </script>
  </article>
</body>
</html>`}
          </pre>
        </div>
      </TabsContent>
      
      <TabsContent value="preview" className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-[60vh] overflow-y-auto">
          <article className="prose lg:prose-lg mx-auto max-w-[600px]">
            <header className="mb-8">
              <h1 
                className="text-3xl font-bold text-gray-900 mb-4"
                style={{ 
                  fontFamily: "'Bebas Neue Bold', 'Impact', sans-serif", 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px' 
                }}
              >
                {formData.title || 'Article Title'}
              </h1>
              <div className="flex items-center justify-between text-gray-600 text-sm">
                <div className="flex items-center">
                  <span style={{ fontFamily: "'Poppins', sans-serif" }}>
                    By {formData.authorLink 
                      ? <a href={formData.authorLink} className="text-blue-600 hover:underline">{formData.author || 'Author'}</a> 
                      : formData.author || 'Author'}
                  </span>
                  <span className="mx-2">•</span>
                  <time 
                    dateTime={formData.publishDate || new Date().toISOString().split('T')[0]}
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {new Date(formData.publishDate || Date.now()).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </time>
                </div>
                <div>
                  {formData.category && (
                    (() => {
                      const categoryColors = getCategoryColor(formData.category);
                      return (
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: categoryColors.bg,
                            color: categoryColors.text,
                            border: `1px solid ${categoryColors.border}`,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        >
                          {formData.category}
                        </span>
                      );
                    })()
                  )}
                </div>
              </div>
            </header>
            
            <p className="text-lg text-gray-700 mb-8 font-medium">
              {formData.introText || formData.excerpt || 'Article summary...'}
            </p>
            
            {formData.mainImageUrl && (
              <figure className="mb-8">
                <img 
                  src={formData.mainImageUrl} 
                  alt={formData.mainImageAlt || `Image illustrating ${formData.title}`}
                  className="w-full h-auto rounded-lg"
                  width="800"
                  height="500"
                  loading="lazy"
                />
                {formData.mainImageCaption && (
                  <figcaption className="text-sm text-gray-600 mt-2 text-center">
                    {formData.mainImageCaption}
                  </figcaption>
                )}
              </figure>
            )}
            
            <section className="article-content mb-8">
              {!formData.content ? (
                <>
                  <h2 
                    className="text-2xl font-bold text-gray-900 mb-4"
                    style={{ 
                      fontFamily: "'Bebas Neue Bold', 'Impact', sans-serif", 
                      textTransform: 'uppercase', 
                      letterSpacing: '1px' 
                    }}
                  >
                    First Important Subheading
                  </h2>
                  <p 
                    className="mb-4 text-gray-700"
                    style={{ 
                      fontFamily: "'Poppins', sans-serif", 
                      fontWeight: 400
                    }}
                  >
                    Content of the first paragraph with <strong className="font-bold text-gray-900">important words</strong> highlighted and relevant <a href="#" className="text-blue-600 hover:underline font-medium">internal links</a>.
                  </p>
                  <p 
                    className="mb-6 text-gray-700"
                    style={{ 
                      fontFamily: "'Poppins', sans-serif", 
                      fontWeight: 400
                    }}
                  >
                    Second paragraph with more details...
                  </p>
                  
                  <h3 
                    className="text-xl font-bold text-gray-900 mb-3"
                    style={{ 
                      fontFamily: "'Bebas Neue Bold', 'Impact', sans-serif", 
                      textTransform: 'uppercase', 
                      letterSpacing: '1px' 
                    }}
                  >
                    Subsection of the first point
                  </h3>
                  <p 
                    className="mb-6 text-gray-700"
                    style={{ 
                      fontFamily: "'Poppins', sans-serif", 
                      fontWeight: 400
                    }}
                  >
                    Development of the subsection with relevant content...
                  </p>
                </>
              ) : (
                <div className="content-wrapper">
                  <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{
                      __html: formData.content
                        .replace(/<h2>/g, '<h2 class="text-2xl font-bold text-gray-900 mb-4" style="font-family: \'Bebas Neue Bold\', \'Impact\', sans-serif; text-transform: uppercase; letter-spacing: 1px;">')
                        .replace(/<h3>/g, '<h3 class="text-xl font-bold text-gray-900 mb-3" style="font-family: \'Bebas Neue Bold\', \'Impact\', sans-serif; text-transform: uppercase; letter-spacing: 1px;">')
                        .replace(/<p>/g, '<p class="mb-4 text-gray-700" style="font-family: \'Poppins\', sans-serif; font-weight: 400;">')
                        .replace(/<strong>/g, '<strong class="font-bold text-gray-900">')
                        .replace(/<a /g, '<a class="text-blue-600 hover:underline font-medium" ')
                        .replace(/<ul>/g, '<ul class="list-disc pl-5 space-y-2 mb-6" style="font-family: \'Poppins\', sans-serif; font-weight: 400;">')
                        .replace(/<ol>/g, '<ol class="list-decimal pl-5 space-y-2 mb-6" style="font-family: \'Poppins\', sans-serif; font-weight: 400;">')
                        .replace(/<li>/g, '<li style="font-family: \'Poppins\', sans-serif; font-weight: 400;">')
                    }}
                  />
                </div>
              )}
            </section>
            
            {formData.tags && formData.tags.trim() !== '' && (
              <footer className="mt-8 pt-6 border-t border-gray-200">
                <section className="tags">
                  {/* <h2 className="text-xl font-semibold mb-3">Tags</h2> */}
                  <ul className="flex flex-wrap gap-2">
                    {formData.tags.split(',').map((tag, index) => {
                      const tagText = tag.trim();
                      if (!tagText) return null;
                      const tagSlug = tagText.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
                      return (
                        <li key={index}>
                          <a 
                            href={`/tags/${tagSlug}`} 
                            rel="tag"
                            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full border border-gray-300 transition-colors"
                          >
                            {tagText}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </footer>
            )}
          </article>
        </div>
      </TabsContent>
      
      <TabsContent value="analyzer" className="space-y-4">
        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 
                className="text-xl font-bold text-gray-900"
                style={{ 
                  fontFamily: "'Bebas Neue Bold', 'Impact', sans-serif", 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px' 
                }}
              >
                SEO Score
              </h3>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-24 h-3 rounded-full overflow-hidden mr-3">
                  <div 
                    className="h-full bg-white opacity-80" 
                    style={{ width: `${100 - seoScore}%`, marginLeft: `${seoScore}%` }} 
                  />
                </div>
                <Badge
                  className={`${
                    seoScore < 50 ? 'bg-red-500' : 
                    seoScore < 75 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  } text-white`}
                >
                  {seoScore}%
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 mb-3">Required Elements</h4>
              
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.title.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                  {formData.title.length > 0 ? (
                    <CircleCheck className="h-4 w-4 text-white" />
                  ) : (
                    <CircleOff className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Title</p>
                  <p className="text-sm text-gray-600">{formData.title.length > 0 ? `${formData.title.length} characters` : 'Missing'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.excerpt.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                  {formData.excerpt.length > 0 ? (
                    <CircleCheck className="h-4 w-4 text-white" />
                  ) : (
                    <CircleOff className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Meta Description</p>
                  <p className="text-sm text-gray-600">{formData.excerpt.length > 0 ? `${formData.excerpt.length} characters` : 'Missing'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.slug.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                  {formData.slug.length > 0 ? (
                    <CircleCheck className="h-4 w-4 text-white" />
                  ) : (
                    <CircleOff className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium">URL Slug</p>
                  <p className="text-sm text-gray-600">{formData.slug.length > 0 ? formData.slug : 'Missing'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.introText.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                  {formData.introText.length > 0 ? (
                    <CircleCheck className="h-4 w-4 text-white" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Introduction</p>
                  <p className="text-sm text-gray-600">{formData.introText.length > 0 ? `${formData.introText.length} characters` : 'Recommended'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.mainImageUrl.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                  {formData.mainImageUrl.length > 0 ? (
                    <CircleCheck className="h-4 w-4 text-white" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Main Image</p>
                  <p className="text-sm text-gray-600">{formData.mainImageUrl.length > 0 ? 'Present' : 'Recommended'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.content.length > 300 ? 'bg-green-500' : 'bg-red-500'}`}>
                  {formData.content.length > 300 ? (
                    <CircleCheck className="h-4 w-4 text-white" />
                  ) : (
                    <CircleOff className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Content</p>
                  <p className="text-sm text-gray-600">
                    {formData.content.length > 0 
                      ? `${formData.content.length} characters ${formData.content.length > 300 ? '(good)' : '(too short)'}` 
                      : 'Missing'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  formData.content.includes('<h2>') ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  {formData.content.includes('<h2>') ? (
                    <CircleCheck className="h-4 w-4 text-white" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Headings Structure</p>
                  <p className="text-sm text-gray-600">
                    {formData.content.includes('<h2>') 
                      ? 'Has H2 headings' 
                      : 'No H2 headings (recommended for SEO)'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">Tips to improve your SEO:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
                  <li>Use relevant keywords in your title and at the beginning of your content</li>
                  <li>Structure your content with subheadings (H2, H3, H4)</li>
                  <li>Add internal links to other relevant articles</li>
                  <li>Ensure your content is at least 300 words (ideally 1000+)</li>
                  <li>Use short paragraphs and lists to improve readability</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Le composant principal avec Dialog qui utilise le contenu
export function BlogPostSEOAssistant({ formData, disabled = false }: BlogPostSEOAssistantProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
          disabled={disabled}
        >
          SEO Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="w-screen max-w-[95vw] sm:max-w-[95vw] md:max-w-[95vw] lg:max-w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>SEO Assistant</DialogTitle>
          <DialogDescription>
            Analyze and optimize your blog post for search engines
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <BlogPostSEOAssistantContent formData={formData} disabled={disabled} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Function to calculate SEO score percentage
function getScorePercentage(formData: BlogPostFormValues): number {
  let score = 0
  let totalMandatory = 4 // Mandatory elements: title, slug, content, excerpt
  let totalOptional = 4 // Optional elements: author, introduction, image, content structure
  
  // Mandatory elements
  if (formData.title.length > 0) score++
  if (formData.excerpt.length > 0) score++
  if (formData.content.length > 300) score++
  if (formData.slug.length > 0) score++
  
  // Optional elements (count as half a point each)
  if (formData.author.length > 0) score += 0.5
  if (formData.introText.length > 0) score += 0.5
  if (formData.mainImageUrl.length > 0) score += 0.5
  if (formData.mainImageAlt.length > 0 && formData.mainImageUrl.length > 0) score += 0.5
  
  // Content structure analysis
  const hasH2 = formData.content.includes('<h2>')
  const hasH3 = formData.content.includes('<h3>')
  const hasParagraphs = formData.content.includes('<p>')
  const hasList = formData.content.includes('<ul>') || formData.content.includes('<ol>')
  
  if (hasH2) score += 0.25
  if (hasH3) score += 0.25
  if (hasParagraphs) score += 0.25
  if (hasList) score += 0.25
  
  return Math.round((score / (totalMandatory + (totalOptional * 0.5))) * 100)
}
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

type BlogPostFormData = {
  title: string
  slug: string
  content: string
  excerpt: string
  status: string
  category: string
  
  // Nouveaux champs
  author: string
  authorLink: string
  publishDate: string
  introText: string
  mainImageUrl: string
  mainImageAlt: string
  mainImageCaption: string
}

interface BlogPostSEOAssistantProps {
  formData: BlogPostFormData
  disabled?: boolean
}

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
          <Tabs defaultValue="html" className="w-full">
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
<body>
  <article>
    <!-- Article header -->
    <header>
      <h1>${formData.title || 'Article Title'}</h1>
      <p class="meta">
        By ${formData.authorLink 
           ? `<a href="${formData.authorLink}">${formData.author || 'Author'}</a>` 
           : formData.author || 'Author'}
        <time datetime="${formData.publishDate || new Date().toISOString().split('T')[0]}">${new Date(formData.publishDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        in <a href="/category/${formData.category}">${formData.category}</a>
      </p>
    </header>
    
    <!-- Introduction -->
    <p class="lead">${formData.introText || formData.excerpt || 'Article summary...'}</p>
    
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
    ${formData.content || 'Article content...'}
    
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
              <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden h-[60vh] overflow-y-auto">
                <article className="p-6">
                  <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.title || 'Article Title'}</h1>
                    <p className="text-sm text-gray-600">
                      By {formData.authorLink 
                          ? <a href={formData.authorLink} className="text-blue-600 hover:underline">{formData.author || 'Author'}</a> 
                          : <span>{formData.author || 'Author'}</span>}
                      {' · '}
                      <time dateTime={formData.publishDate || new Date().toISOString().split('T')[0]}>
                        {new Date(formData.publishDate || Date.now()).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                      {' · '}
                      in <a href="#" className="text-blue-600 hover:underline">{formData.category}</a>
                    </p>
                  </header>
                  
                  <p className="text-lg font-medium text-gray-700 mb-6">
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">First Important Subheading</h2>
                        <p className="mb-4 text-gray-700">
                          Content of the first paragraph with <strong className="font-bold text-gray-900">important words</strong> highlighted and relevant <a href="#" className="text-blue-600 hover:underline font-medium">internal links</a>.
                        </p>
                        <p className="mb-6 text-gray-700">Second paragraph with more details...</p>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Subsection of the first point</h3>
                        <p className="mb-6 text-gray-700">Development of the subsection with relevant content...</p>
                      </>
                    ) : (
                      <div className="content-wrapper">
                        <div
                          className="blog-content"
                          dangerouslySetInnerHTML={{
                            __html: formData.content
                              .replace(/<h2>/g, '<h2 class="text-2xl font-bold text-gray-900 mb-4">')
                              .replace(/<h3>/g, '<h3 class="text-xl font-bold text-gray-900 mb-3">')
                              .replace(/<p>/g, '<p class="mb-4 text-gray-700">')
                              .replace(/<strong>/g, '<strong class="font-bold text-gray-900">')
                              .replace(/<a /g, '<a class="text-blue-600 hover:underline font-medium" ')
                              .replace(/<ul>/g, '<ul class="list-disc pl-5 space-y-2 mb-6">')
                              .replace(/<ol>/g, '<ol class="list-decimal pl-5 space-y-2 mb-6">')
                          }}
                        />
                      </div>
                    )}
                  </section>
                </article>
              </div>
              <div className="w-full max-w-4xl mx-auto">
                <p className="text-sm text-gray-500 mb-6 text-center italic">
                  Cette prévisualisation montre le rendu de votre article avec la mise en forme appropriée.
                </p>
                <p className="text-sm text-gray-700 bg-yellow-50 p-4 border-l-4 border-yellow-500 rounded">
                  <strong>Note:</strong> Le balisage final inclut des données structurées (JSON-LD) et des méta-tags qui ne sont pas visibles dans la page rendue, mais qui sont essentiels pour les moteurs de recherche.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="analyzer" className="space-y-4">
              <div className="bg-white p-6 rounded-lg border border-gray-200 h-[60vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-6">SEO Analysis</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-lg mb-4">Essential Elements</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.title.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                            {formData.title.length > 0 ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M20.285 5.297L9 16.582l-5.285-5.285a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l12-12a1 1 0 10-1.414-1.414z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                              </svg>
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
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M20.285 5.297L9 16.582l-5.285-5.285a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l12-12a1 1 0 10-1.414-1.414z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Meta Description</p>
                            <p className="text-sm text-gray-600">{formData.excerpt.length > 0 ? `${formData.excerpt.length} characters` : 'Missing'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.author.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                            {formData.author.length > 0 ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M20.285 5.297L9 16.582l-5.285-5.285a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l12-12a1 1 0 10-1.414-1.414z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Author</p>
                            <p className="text-sm text-gray-600">{formData.author.length > 0 ? formData.author : 'Recommended'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.introText.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                            {formData.introText.length > 0 ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M20.285 5.297L9 16.582l-5.285-5.285a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l12-12a1 1 0 10-1.414-1.414z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              </svg>
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
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M20.285 5.297L9 16.582l-5.285-5.285a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l12-12a1 1 0 10-1.414-1.414z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              </svg>
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
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M20.285 5.297L9 16.582l-5.285-5.285a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l12-12a1 1 0 10-1.414-1.414z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                              </svg>
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
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.slug.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                            {formData.slug.length > 0 ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M20.285 5.297L9 16.582l-5.285-5.285a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l12-12a1 1 0 10-1.414-1.414z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Slug (URL)</p>
                            <p className="text-sm text-gray-600">{formData.slug.length > 0 ? formData.slug : 'Missing'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-lg mb-4">Score and Recommendations</h4>
                      
                      <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">Overall SEO Score</p>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className={`h-4 rounded-full ${
                              getScorePercentage(formData) >= 80 
                                ? 'bg-green-500' 
                                : getScorePercentage(formData) >= 50 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${getScorePercentage(formData)}%` }}
                          ></div>
                        </div>
                        <p className="text-right text-sm mt-1">{getScorePercentage(formData)}%</p>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Recommendations:</h4>
                        <ul className="space-y-2">
                          {getRecommendations(formData).map((recommendation, index) => (
                            <li key={index} className="flex items-start gap-2 text-red-700">
                              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                              </svg>
                              <span>{recommendation}</span>
                            </li>
                          ))}
                          {getRecommendations(formData).length === 0 && (
                            <li className="flex items-start gap-2 text-green-700">
                              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                              </svg>
                              <span>All essential elements are present. Great job!</span>
                            </li>
                          )}
                        </ul>
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
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Function to calculate SEO score percentage
function getScorePercentage(formData: BlogPostFormData): number {
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

// Function to get recommendations list
function getRecommendations(formData: BlogPostFormData): string[] {
  const recommendations = []
  
  // Recommendations for mandatory elements
  if (formData.title.length === 0) recommendations.push('Add a title to your article')
  if (formData.excerpt.length === 0) recommendations.push('Add an excerpt to improve search results')
  if (formData.content.length < 300) recommendations.push('Your content should be at least 300 characters')
  if (formData.slug.length === 0) recommendations.push('Create a slug for your URL')
  
  // Recommendations for optional elements
  if (formData.author.length === 0) recommendations.push('Add the author name to improve credibility')
  if (formData.introText.length === 0) recommendations.push('Add an introduction paragraph to capture attention')
  if (formData.mainImageUrl.length === 0) recommendations.push('Add a main image for better engagement')
  if (formData.mainImageUrl.length > 0 && formData.mainImageAlt.length === 0) recommendations.push('Add alt text to your image for accessibility and SEO')
  
  // Content structure recommendations
  const hasH2 = formData.content.includes('<h2>')
  const hasH3 = formData.content.includes('<h3>')
  const hasParagraphs = formData.content.includes('<p>')
  const hasList = formData.content.includes('<ul>') || formData.content.includes('<ol>')
  
  if (!hasH2 && formData.content.length > 300) recommendations.push('Add H2 headings for better content structure and readability')
  if (!hasH3 && formData.content.length > 600) recommendations.push('Consider adding H3 subheadings for detailed sections')
  if (!hasParagraphs && formData.content.length > 0) recommendations.push('Structure your content with paragraphs')
  if (!hasList && formData.content.length > 500) recommendations.push('Consider using lists for better readability')
  
  return recommendations
}
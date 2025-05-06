'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function BlogPostSEOHelper() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
          <QuestionMarkCircledIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-screen max-w-[95vw] sm:max-w-[95vw] md:max-w-[95vw] lg:max-w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Optimal HTML Structure for SEO</DialogTitle>
          <DialogDescription>
            Use this structure as a guide to create blog posts optimized for search engines.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <Tabs defaultValue="structure" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="structure">HTML Structure</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="structure" className="space-y-4">
              <div className="bg-muted p-4 rounded-lg overflow-x-auto w-full">
                <pre className="text-sm whitespace-pre-wrap w-full">
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Main Article Title - Site Name</title>
  <meta name="description" content="A compelling description of 150-160 characters that summarizes the article.">
  
  <!-- Open Graph Meta for social networks -->
  <meta property="og:title" content="Main Article Title">
  <meta property="og:description" content="Description for social networks">
  <meta property="og:image" content="URL of the main image">
  <meta property="og:url" content="Article URL">
  <meta property="og:type" content="article">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Main Article Title">
  <meta name="twitter:description" content="Description for Twitter">
  <meta name="twitter:image" content="URL of the main image">
  
  <!-- Canonical tag (avoids duplicate content) -->
  <link rel="canonical" href="Canonical URL of the article">
</head>
<body>
  <article>
    <!-- Article header -->
    <header>
      <h1>Main Article Title (only one H1 per page)</h1>
      <p class="meta">
        By <a href="/author/author-name">Author Name</a>
        <time datetime="2023-11-15">November 15, 2023</time>
        in <a href="/category/category-name">Category Name</a>
      </p>
    </header>
    
    <!-- Introduction -->
    <p class="lead">A short introductory paragraph that summarizes the article and captures the reader's attention. This part is essential as it is often displayed in search results.</p>
    
    <!-- Main image with alt and title attributes -->
    <figure>
      <img 
        src="/path/to/image.jpg" 
        alt="Detailed description of the image for accessibility and SEO" 
        title="Informative title on hover"
        width="800" 
        height="500" 
        loading="lazy">
      <figcaption>Explanatory caption for the image that adds context</figcaption>
    </figure>
    
    <!-- Article body structured with subheadings -->
    <section>
      <h2>First Important Subheading</h2>
      <p>Content of the first paragraph with <strong>important words</strong> highlighted and relevant <a href="/internal-page">internal links</a>.</p>
      <p>Second paragraph with more details...</p>
      
      <h3>Subsection of the first point</h3>
      <p>Development of the subsection with relevant content...</p>
      
      <!-- Bullet list for better readability -->
      <h3>Key Points to Remember</h3>
      <ul>
        <li>First important point</li>
        <li>Second point with <a href="https://example.com" rel="noopener noreferrer">external link</a></li>
        <li>Third detailed point</li>
      </ul>
    </section>
    
    <section>
      <h2>Second Main Subheading</h2>
      <p>Content developing the second main aspect...</p>
      
      <!-- Table for presenting structured data -->
      <h3>Data Comparison</h3>
      <table>
        <caption>Explanatory title for the table</caption>
        <thead>
          <tr>
            <th>Criterion</th>
            <th>Value A</th>
            <th>Value B</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>First criterion</td>
            <td>Data 1A</td>
            <td>Data 1B</td>
          </tr>
          <tr>
            <td>Second criterion</td>
            <td>Data 2A</td>
            <td>Data 2B</td>
          </tr>
        </tbody>
      </table>
    </section>
    
    <!-- Conclusion -->
    <section>
      <h2>Conclusion</h2>
      <p>Summary of key points covered in the article and final conclusion...</p>
      <p>Call to action or question to encourage engagement...</p>
    </section>
    
    <!-- Related articles section -->
    <aside>
      <h3>Related Articles</h3>
      <ul>
        <li><a href="/article-1">Title of related article 1</a></li>
        <li><a href="/article-2">Title of related article 2</a></li>
        <li><a href="/article-3">Title of related article 3</a></li>
      </ul>
    </aside>
    
    <!-- Structured data markup for search engines -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Main Article Title",
      "image": "URL of the main image",
      "datePublished": "2023-11-15T08:00:00+01:00",
      "dateModified": "2023-11-15T10:30:00+01:00",
      "author": {
        "@type": "Person",
        "name": "Author Name"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Site Name",
        "logo": {
          "@type": "ImageObject",
          "url": "Logo URL"
        }
      },
      "description": "Article description for search engines"
    }
    </script>
  </article>
</body>
</html>`}
                </pre>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">SEO Best Practices</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use only one H1 per page (main title)</li>
                  <li>Structure your content with H2, H3, H4 in a hierarchical manner</li>
                  <li>Include relevant keywords in titles and at the beginning of paragraphs</li>
                  <li>Add descriptive alt attributes to all images</li>
                  <li>Create readable and descriptive URLs (slug)</li>
                  <li>Integrate internal links to other relevant content on your site</li>
                  <li>Use structured content (schema.org) to improve search engine understanding</li>
                  <li>Ensure your content has at least 300 words (ideally 1000+)</li>
                  <li>Use short paragraphs and lists to improve readability</li>
                  <li>Add unique and appealing meta descriptions</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="preview" className="space-y-8">
              <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
                <article className="p-6">
                  {/* Article header */}
                  <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Main Article Title (only one H1 per page)</h1>
                    <p className="text-sm text-gray-600">
                      By <a href="#" className="text-blue-600 hover:underline">Author Name</a>
                      {' · '}
                      <time dateTime="2023-11-15">November 15, 2023</time>
                      {' · '}
                      in <a href="#" className="text-blue-600 hover:underline">Category Name</a>
                    </p>
                  </header>
                  
                  {/* Introduction */}
                  <p className="text-lg font-medium text-gray-700 mb-6">
                    A short introductory paragraph that summarizes the article and captures the reader's attention. 
                    This part is essential as it is often displayed in search results.
                  </p>
                  
                  {/* Main image */}
                  <figure className="mb-8">
                    <img 
                      src="https://images.unsplash.com/photo-1504805572947-34fad45aed93?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80" 
                      alt="Detailed description of the image for accessibility and SEO" 
                      title="Informative title on hover"
                      className="w-full h-auto rounded-lg"
                      width="800" 
                      height="500" 
                      loading="lazy" />
                    <figcaption className="text-sm text-gray-600 mt-2 text-center">
                      Explanatory caption for the image that adds context
                    </figcaption>
                  </figure>
                  
                  {/* First section */}
                  <section className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">First Important Subheading</h2>
                    <p className="mb-4">
                      Content of the first paragraph with <strong>important words</strong> highlighted 
                      and relevant <a href="#" className="text-blue-600 hover:underline">internal links</a>.
                    </p>
                    <p className="mb-6">Second paragraph with more details...</p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Subsection of the first point</h3>
                    <p className="mb-6">Development of the subsection with relevant content...</p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Key Points to Remember</h3>
                    <ul className="list-disc pl-5 space-y-2 mb-6">
                      <li>First important point</li>
                      <li>Second point with <a href="https://example.com" rel="noopener noreferrer" className="text-blue-600 hover:underline">external link</a></li>
                      <li>Third detailed point</li>
                    </ul>
                  </section>
                  
                  {/* Second section */}
                  <section className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Second Main Subheading</h2>
                    <p className="mb-6">Content developing the second main aspect...</p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Data Comparison</h3>
                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <caption className="text-sm text-gray-600 mb-2">
                          Explanatory title for the table
                        </caption>
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">Criterion</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Value A</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Value B</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">First criterion</td>
                            <td className="border border-gray-300 px-4 py-2">Data 1A</td>
                            <td className="border border-gray-300 px-4 py-2">Data 1B</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">Second criterion</td>
                            <td className="border border-gray-300 px-4 py-2">Data 2A</td>
                            <td className="border border-gray-300 px-4 py-2">Data 2B</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                  
                  {/* Conclusion */}
                  <section className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Conclusion</h2>
                    <p className="mb-4">Summary of key points covered in the article and final conclusion...</p>
                    <p className="mb-4">Call to action or question to encourage engagement...</p>
                  </section>
                  
                  {/* Related articles */}
                  <aside className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Related Articles</h3>
                    <ul className="space-y-2">
                      <li><a href="#" className="text-blue-600 hover:underline">Title of related article 1</a></li>
                      <li><a href="#" className="text-blue-600 hover:underline">Title of related article 2</a></li>
                      <li><a href="#" className="text-blue-600 hover:underline">Title of related article 3</a></li>
                    </ul>
                  </aside>
                </article>
              </div>
              <div className="w-full max-w-4xl mx-auto">
                <p className="text-sm text-gray-500 mb-6 text-center italic">
                  The preview above shows how this structure renders in a typical blog layout with proper styling.
                </p>
                <p className="text-sm text-gray-700 bg-yellow-50 p-4 border-l-4 border-yellow-500 rounded">
                  <strong>Note:</strong> The actual markup includes structured data (JSON-LD) and meta tags that aren't visible in the rendered page, 
                  but are crucial for search engines to understand your content.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
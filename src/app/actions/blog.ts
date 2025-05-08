'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PostStatus } from '@prisma/client'
import { BlogPostFormValues, StructuredContent } from '@/types/blog'

// Préfixe pour identifier le contenu structuré (pour la rétrocompatibilité avec l'ancien format)
const STRUCTURED_CONTENT_PREFIX = '<!-- STRUCTURED_CONTENT_JSON:'
const STRUCTURED_CONTENT_SUFFIX = '-->'

// Fonction pour encoder le contenu structuré (conservée pour compatibilité)
function encodeStructuredContent(rawContent: string, structuredContent?: StructuredContent): string {
    if (!structuredContent) {
        return rawContent
    }

    // On stocke uniquement le JSON structuré
    return JSON.stringify(structuredContent)
}

// Fonction pour décoder le contenu structuré
function decodeStructuredContent(content: string): { rawContent: string, structuredContent?: StructuredContent } {
    // Si le contenu est vide ou null
    if (!content) {
        return { rawContent: '' };
    }

    try {
        // Vérifier d'abord si c'est un JSON valide (notre format principal maintenant)
        try {
            const structuredContent = JSON.parse(content) as StructuredContent;

            if (Array.isArray(structuredContent) && structuredContent.length > 0) {
                console.log('Format détecté: JSON pur (format standard)');
                // Générer le HTML à partir du JSON pour l'affichage
                const rawContent = generateRawContentFromSections(structuredContent);
                return { rawContent, structuredContent };
            }
        } catch (jsonError) {
            // Pas un JSON valide, essayons l'ancien format avec commentaires
        }

        // Vérifier si c'est l'ancien format avec JSON dans commentaires
        if (content.startsWith(STRUCTURED_CONTENT_PREFIX)) {
            const endOfJson = content.indexOf(STRUCTURED_CONTENT_SUFFIX);
            if (endOfJson !== -1) {
                // Extraire le JSON des commentaires
                const jsonStr = content.substring(STRUCTURED_CONTENT_PREFIX.length, endOfJson);
                const structuredContent = JSON.parse(jsonStr) as StructuredContent;

                // Extraire le contenu HTML après les marqueurs
                const rawContent = content.substring(endOfJson + STRUCTURED_CONTENT_SUFFIX.length).trim();

                console.log('Format détecté: JSON en commentaire + HTML (ancien format)');
                return { rawContent, structuredContent };
            }
        }

        // Si on arrive ici, c'est probablement du HTML pur ou un autre format non reconnu
        console.log('Format détecté: HTML pur ou format inconnu (fallback)');
        return { rawContent: content };
    } catch (e) {
        console.error('Erreur lors du décodage du contenu structuré:', e);
        // En cas d'erreur, retourner le contenu tel quel
        return { rawContent: content };
    }
}

// Fonction pour générer le contenu HTML à partir des sections structurées
function generateRawContentFromSections(sectionsArray: StructuredContent, postData?: any): string {
    // Générer le contenu HTML des sections
    const sectionsContent = sectionsArray.map(section => {
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

        return `<section>\n${sectionContent}\n</section>`
    }).join('\n\n')

    // Extraire les données du post pour les métadonnées si disponibles
    const title = postData?.title || 'Article de blog';
    const description = postData?.metaDescription || postData?.excerpt || '';
    const authorName = postData?.author || '';
    const mainImageUrl = postData?.mainImageUrl || '';
    const mainImageAlt = postData?.mainImageAlt || '';
    const mainImageCaption = postData?.mainImageCaption || '';
    const introText = postData?.introText || '';

    // Générer la page HTML complète
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
}

// Fonction pour extraire l'ID YouTube d'une URL
function extractYouTubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : ''
}

export async function createBlogPost(formData: BlogPostFormValues) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            return { error: 'Not authenticated' }
        }

        console.log('Starting blog post creation with data:', {
            title: formData.title,
            slug: formData.slug,
            category: formData.category,
            tags: formData.tags
        })

        // Log structured content for debugging
        console.log('structuredContent disponible:', !!formData.structuredContent);

        if (formData.structuredContent) {
            console.log('structuredContent aperçu:',
                JSON.stringify(formData.structuredContent).substring(0, 200) + '...');

            // Vérifier que c'est bien un tableau
            if (!Array.isArray(formData.structuredContent)) {
                console.error('structuredContent n\'est pas un tableau valide!');
                try {
                    // Tentative de parser si c'est une chaîne JSON
                    if (typeof formData.structuredContent === 'string') {
                        formData.structuredContent = JSON.parse(formData.structuredContent);
                        console.log('structuredContent parsé avec succès depuis la chaîne JSON');
                    } else {
                        console.error('structuredContent est de type invalide:', typeof formData.structuredContent);
                    }
                } catch (err) {
                    console.error('Erreur lors du parsing de structuredContent:', err);
                }
            }
        } else {
            console.log('Aucun contenu structuré disponible, création par défaut');
            // Créer un contenu structuré par défaut si inexistant
            formData.structuredContent = [{
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                elements: [{
                    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                    type: 'paragraph',
                    content: formData.content || 'Nouveau contenu'
                }]
            }];
            console.log('Contenu structuré par défaut créé:', formData.structuredContent);
        }

        // Find the category ID or create a new one
        const category = await prisma.seoCategory.upsert({
            where: { name: formData.category },
            update: {},
            create: {
                name: formData.category,
                description: `Category for ${formData.category} posts`,
            },
        })

        console.log('Category found/created:', category)

        // Parse tags
        let parsedTags: string[] = []
        try {
            if (formData.tags) {
                if (formData.tags.startsWith('[')) {
                    // Try parsing as JSON
                    parsedTags = JSON.parse(formData.tags)
                    console.log('Tags parsed as JSON:', parsedTags)
                } else {
                    // Parse as comma-separated string
                    parsedTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                    console.log('Tags parsed as comma-separated:', parsedTags)
                }
            }
        } catch (error) {
            console.error('Error parsing tags:', error)
            parsedTags = []
        }

        // Set the proper status as an enum value
        const status: PostStatus = formData.status === 'published' ? PostStatus.PUBLISHED : PostStatus.DRAFT

        // Stocker uniquement le JSON structuré dans le champ content
        // Si structuredContent n'existe pas, on stocke le contenu brut comme fallback
        const content = formData.structuredContent
            ? JSON.stringify(formData.structuredContent)
            : formData.content;

        // Préparer les données complètes du post pour générer le HTML
        const postDataForHTML = {
            title: formData.title,
            metaDescription: formData.excerpt,
            excerpt: formData.introText,
            mainImageUrl: formData.mainImageUrl,
            mainImageAlt: formData.mainImageAlt,
            mainImageCaption: formData.mainImageCaption,
            author: formData.author,
            authorLink: formData.authorLink,
            introText: formData.introText
        };

        // Générer le HTML à partir du contenu structuré pour le stocker dans generatedHtml
        const generatedHtml = formData.structuredContent
            ? generateRawContentFromSections(formData.structuredContent, postDataForHTML)
            : formData.content || '';

        console.log('Contenu JSON à sauvegarder (début):', content.substring(0, 200) + '...');
        console.log('Longueur du contenu JSON:', content.length);
        console.log('HTML généré à sauvegarder (début):', generatedHtml.substring(0, 200) + '...');

        // Prepare minimal data needed for post creation
        const postData = {
            title: formData.title,
            slug: formData.slug,
            metaDescription: formData.excerpt,
            metaKeywords: [],
            excerpt: formData.introText,
            mainImageUrl: formData.mainImageUrl,
            mainImageAlt: formData.mainImageAlt,
            mainImageCaption: formData.mainImageCaption,
            content,
            generatedHtml, // Ajouter le HTML généré
            status, // Use the enum value
            published: formData.status === 'published',
            categoryId: category.id,
            author: formData.author,
            authorLink: formData.authorLink
        }

        console.log('Prepared post data:', postData)

        // Create the post
        const post = await prisma.seoPost.create({
            data: postData
        })

        console.log('Post created successfully:', post.id)

        revalidatePath('/blog-posts')

        return { success: true, post }
    } catch (error) {
        console.error('Failed to create blog post:', error)
        if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack)
        }
        return { error: 'Failed to create blog post' }
    }
}

export async function getBlogPost(id: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            return { error: 'Non authentifié' }
        }

        const post = await prisma.seoPost.findUnique({
            where: { id },
            include: {
                category: true
            }
        })

        if (!post) {
            return { error: 'Article non trouvé' }
        }

        // Décoder le contenu structuré s'il existe
        const { rawContent, structuredContent } = decodeStructuredContent(post.content)

        console.log('getBlogPost - Contenu décodé:');
        console.log('- HTML brut (début):', rawContent.substring(0, 500) + '...');
        console.log('- JSON structuré disponible:', !!structuredContent);
        console.log('- HTML généré stocké (début):', post.generatedHtml?.substring(0, 500) + '...');

        if (structuredContent) {
            console.log('- Structure JSON (aperçu):',
                JSON.stringify(structuredContent).substring(0, 500) + '...'
            );
        }

        // Pour l'édition, on retourne simplement le contenu original pour que l'éditeur puisse le reconstituer
        // Si c'est du contenu structuré, on renvoie le JSON structuré
        // Sinon, on renvoie le contenu brut
        return {
            success: true,
            post: {
                ...post,
                // Lors de l'édition, le contenu brut est généré à la volée par l'éditeur
                content: structuredContent ? rawContent : post.content,
                // On transmet directement la structure JSON pour l'éditeur
                structuredContent,
                // On transmet également le HTML généré stocké
                generatedHtml: post.generatedHtml || rawContent
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'article:', error)
        return { error: 'Erreur lors de la récupération de l\'article' }
    }
}

export async function updateBlogPost(id: number, formData: BlogPostFormValues) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            return { error: 'Non authentifié' }
        }

        // Log détaillé des données reçues
        console.log('updateBlogPost - Données reçues:');
        console.log('- titre:', formData.title);
        console.log('- structuredContent disponible:', !!formData.structuredContent);

        if (formData.structuredContent) {
            console.log('- structuredContent aperçu:',
                JSON.stringify(formData.structuredContent).substring(0, 200) + '...');

            // Vérifier spécifiquement les valeurs de h3
            const h3Elements: Array<{ id: string, content: string }> = [];
            if (Array.isArray(formData.structuredContent)) {
                formData.structuredContent.forEach(section => {
                    if (section.elements) {
                        section.elements.forEach(element => {
                            if (element.type === 'h3') {
                                h3Elements.push({
                                    id: element.id,
                                    content: element.content
                                });
                            }
                        });
                    }
                });
            }
            console.log('- h3 elements trouvés:', h3Elements);
        }

        // Find the category ID or create a new one
        const category = await prisma.seoCategory.upsert({
            where: { name: formData.category },
            update: {},
            create: {
                name: formData.category,
                description: `Catégorie pour les articles ${formData.category}`,
            },
        })

        // Parse tags
        let parsedTags: string[] = []
        try {
            if (formData.tags) {
                if (formData.tags.startsWith('[')) {
                    // Try parsing as JSON
                    parsedTags = JSON.parse(formData.tags)
                } else {
                    // Parse as comma-separated string
                    parsedTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                }
            }
        } catch (error) {
            console.error('Erreur lors du parsing des tags:', error)
            parsedTags = []
        }

        // Set the proper status as an enum value
        const status: PostStatus = formData.status === 'published' ? PostStatus.PUBLISHED : PostStatus.DRAFT

        // Stocker uniquement le JSON structuré dans le champ content
        // Si structuredContent n'existe pas, on stocke le contenu brut comme fallback
        const content = formData.structuredContent
            ? JSON.stringify(formData.structuredContent)
            : formData.content;

        // Préparer les données complètes du post pour générer le HTML
        const postDataForHTML = {
            title: formData.title,
            metaDescription: formData.excerpt,
            excerpt: formData.introText,
            mainImageUrl: formData.mainImageUrl,
            mainImageAlt: formData.mainImageAlt,
            mainImageCaption: formData.mainImageCaption,
            author: formData.author,
            authorLink: formData.authorLink,
            introText: formData.introText
        };

        // Générer le HTML à partir du contenu structuré pour le stocker dans generatedHtml
        const generatedHtml = formData.structuredContent
            ? generateRawContentFromSections(formData.structuredContent, postDataForHTML)
            : formData.content || '';

        console.log('Contenu JSON à sauvegarder (début):', content.substring(0, 200) + '...');
        console.log('HTML généré à sauvegarder (début):', generatedHtml.substring(0, 200) + '...');

        // Prepare data for update
        const postData = {
            title: formData.title,
            slug: formData.slug,
            metaDescription: formData.excerpt,
            metaKeywords: [],
            excerpt: formData.introText,
            mainImageUrl: formData.mainImageUrl,
            mainImageAlt: formData.mainImageAlt,
            mainImageCaption: formData.mainImageCaption,
            content,
            generatedHtml, // Ajouter le HTML généré
            status,
            published: formData.status === 'published',
            categoryId: category.id,
            author: formData.author,
            authorLink: formData.authorLink
        }

        // Update the post
        const post = await prisma.seoPost.update({
            where: { id },
            data: postData
        })

        console.log('Article mis à jour avec succès:', post.id);
        revalidatePath('/blog-posts')

        return { success: true, post }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'article:', error)
        if (error instanceof Error) {
            console.error('Détails de l\'erreur:', error.message, error.stack)
        }
        return { error: 'Erreur lors de la mise à jour de l\'article' }
    }
} 
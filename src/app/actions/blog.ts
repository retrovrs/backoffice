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

// Fonction pour encoder le contenu structuré
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

    // Tester d'abord si c'est un JSON valide
    try {
        // Vérifier si le contenu commence par le préfixe (ancien format)
        if (content.startsWith(STRUCTURED_CONTENT_PREFIX)) {
            const endOfJson = content.indexOf(STRUCTURED_CONTENT_SUFFIX);
            if (endOfJson === -1) {
                return { rawContent: content };
            }

            const jsonStr = content.substring(STRUCTURED_CONTENT_PREFIX.length, endOfJson);
            const structuredContent = JSON.parse(jsonStr) as StructuredContent;

            // Extraire le contenu brut après les marqueurs (pour la compatibilité avec l'ancien format)
            const rawContent = content.substring(endOfJson + STRUCTURED_CONTENT_SUFFIX.length).trim();

            // Générer le HTML à partir de la structure JSON
            return { rawContent, structuredContent };
        }

        // Nouveau format: juste du JSON
        const structuredContent = JSON.parse(content) as StructuredContent;

        // Vérifier si c'est bien un tableau avec la structure attendue
        if (Array.isArray(structuredContent) && structuredContent.length > 0) {
            // Générer le contenu HTML à partir du JSON structuré
            const rawContent = generateRawContentFromSections(structuredContent);
            return { rawContent, structuredContent };
        } else {
            // Si c'est du JSON mais pas au format attendu
            console.warn('Le contenu JSON n\'est pas au format structuré attendu');
            return { rawContent: content };
        }
    } catch (e) {
        console.error('Erreur lors du décodage du contenu structuré:', e);
        // Si ce n'est pas un JSON valide, considérer que c'est du contenu brut
        return { rawContent: content };
    }
}

// Fonction pour générer le contenu HTML à partir des sections structurées
function generateRawContentFromSections(sectionsArray: StructuredContent): string {
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
        console.log('Content structuré avant encodage:',
            formData.structuredContent
                ? JSON.stringify(formData.structuredContent, null, 2).substring(0, 500) + '...'
                : 'Non disponible'
        );
        console.log('Content brut avant encodage:',
            formData.content.substring(0, 500) + '...'
        );

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

        // Encoder le contenu structuré s'il existe
        const content = encodeStructuredContent(formData.content, formData.structuredContent)

        // Log encoded content
        console.log('Contenu encodé (début):', content.substring(0, 500) + '...');

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
                structuredContent
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

        // Log content data before encoding
        console.log('updateBlogPost - Content data:');
        console.log('- HTML brut (début):', formData.content.substring(0, 500) + '...');
        console.log('- JSON structuré disponible:', !!formData.structuredContent);

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

        // Encoder le contenu structuré s'il existe
        const content = encodeStructuredContent(formData.content, formData.structuredContent)

        // Log encoded content
        console.log('Contenu encodé (début):', content.substring(0, 500) + '...');

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
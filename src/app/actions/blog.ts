'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PostStatus } from '@prisma/client'
import { BlogPostFormValues, StructuredContent } from '@/types/blog'

// Préfixe pour identifier le contenu structuré
const STRUCTURED_CONTENT_PREFIX = '<!-- STRUCTURED_CONTENT_JSON:'
const STRUCTURED_CONTENT_SUFFIX = '-->'

// Fonction pour encoder le contenu structuré
function encodeStructuredContent(rawContent: string, structuredContent?: StructuredContent): string {
    if (!structuredContent) {
        return rawContent
    }

    // Convertir le contenu structuré en JSON et l'envelopper avec les marqueurs
    const structuredJson = JSON.stringify(structuredContent)
    return `${STRUCTURED_CONTENT_PREFIX}${structuredJson}${STRUCTURED_CONTENT_SUFFIX}\n\n${rawContent}`
}

// Fonction pour décoder le contenu structuré
function decodeStructuredContent(content: string): { rawContent: string, structuredContent?: StructuredContent } {
    if (!content.startsWith(STRUCTURED_CONTENT_PREFIX)) {
        return { rawContent: content }
    }

    try {
        const endOfJson = content.indexOf(STRUCTURED_CONTENT_SUFFIX)
        if (endOfJson === -1) {
            return { rawContent: content }
        }

        const jsonStr = content.substring(STRUCTURED_CONTENT_PREFIX.length, endOfJson)
        const structuredContent = JSON.parse(jsonStr) as StructuredContent

        // Extraire le contenu brut après les marqueurs
        const rawContent = content.substring(endOfJson + STRUCTURED_CONTENT_SUFFIX.length).trim()

        return { rawContent, structuredContent }
    } catch (e) {
        console.error('Erreur lors du décodage du contenu structuré:', e)
        return { rawContent: content }
    }
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

        // Retourner le post avec le contenu décodé
        return {
            success: true,
            post: {
                ...post,
                content: rawContent,
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
'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PostStatus } from '@prisma/client'

export type BlogPostFormValues = {
    title: string
    slug: string
    excerpt: string
    status: string
    category: string
    author: string
    publishDate: string
    introText: string
    mainImageUrl: string
    mainImageAlt: string
    mainImageCaption: string
    content: string
    tags: string
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
            content: formData.content,
            status, // Use the enum value
            published: formData.status === 'published',
            categoryId: category.id,
            author: formData.author
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
'use server'

import prisma from '@/lib/prisma'

export async function getCategories() {
  try {
    const categories = await prisma.seoCategory.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    return { 
      success: true, 
      categories 
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return { 
      success: false, 
      error: 'Failed to fetch categories' 
    }
  }
} 
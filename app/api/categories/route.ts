import { NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Category from '@/models/Category'
import { ERROR_MESSAGES } from '@/lib/validation-ar'

export async function GET() {
  try {
    console.log('Fetching categories...')
    const categories = await withDB(async () => {
      const allCategories = await Category.find().lean()
      console.log('Categories found:', allCategories.length)
      
      if (allCategories.length === 0) {
        console.warn('No categories found in database! Run seed script: npm run db:seed')
        return []
      }
      
      // ترتيب التصنيفات - نظريات أولاً
      const sorted = allCategories.sort((a: any, b: any) => {
        if (a.slug === 'theories') return -1
        if (b.slug === 'theories') return 1
        return a.name.localeCompare(b.name, 'ar')
      })
      
      // Convert _id to string for frontend
      return sorted.map((cat: any) => ({
        _id: cat._id.toString(),
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        color: cat.color,
      }))
    })

    console.log('Categories returned:', categories.length)
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}


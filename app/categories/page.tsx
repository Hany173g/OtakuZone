import { withDB } from '@/lib/db'
import Category from '@/models/Category'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CategoryCard from '@/components/CategoryCard'

export default async function CategoriesPage() {
  const categories = await withDB(async () => {
    const cats = await Category.find().lean()
    // ترتيب - نظريات أولاً
    return cats.sort((a: any, b: any) => {
      if (a.slug === 'theories') return -1
      if (b.slug === 'theories') return 1
      return a.name.localeCompare(b.name, 'ar')
    })
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="text-gray-600 hover:text-anime-purple"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-4xl font-bold text-gray-800">جميع التصنيفات</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category: any) => (
          <CategoryCard
            key={category._id || category.id}
            category={{
              name: category.name,
              slug: category.slug,
              color: category.color || '#6b7280',
            }}
          />
        ))}
      </div>
    </div>
  )
}

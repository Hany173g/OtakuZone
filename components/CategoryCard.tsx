'use client'

import Link from 'next/link'
import { memo } from 'react'
import { Film, Heart, Globe, Rocket, Laugh, Sparkles, Zap, Drama, Lightbulb } from 'lucide-react'

interface CategoryCardProps {
  category: {
    name: string
    slug: string
    color: string
  }
}

const categoryIcons: Record<string, React.ElementType> = {
  theories: Lightbulb,
  shounen: Film,
  shoujo: Heart,
  'isekai': Globe,
  'sci-fi': Rocket,
  comedy: Laugh,
  romance: Sparkles,
  action: Zap,
  drama: Drama,
}

function CategoryCard({ category }: CategoryCardProps) {
  const Icon = categoryIcons[category.slug] || Film
  
  const hex = category.color?.startsWith('#') ? category.color : '#6b7280'
  const gradientStyle = {
    backgroundImage: `linear-gradient(135deg, ${hex}, ${hex}dd)`,
  } as const

  return (
    <Link
      href={`/forum?category=${category.slug}`}
      className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 hover:border-anime-purple/30"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full" style={gradientStyle}></div>
      
      {/* Content */}
      <div className="relative flex flex-col items-center text-center gap-3">
        {/* Icon */}
        <div className="p-3 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform" style={gradientStyle}>
          <Icon className="w-6 h-6" />
        </div>
        
        {/* Category name */}
        <h3 className="text-base font-bold text-gray-800 group-hover:text-anime-purple transition-colors">
          {category.name}
        </h3>
      </div>
    </Link>
  )
}

export default memo(CategoryCard)

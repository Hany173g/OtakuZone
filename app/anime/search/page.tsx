'use client'

import { useState } from 'react'
import { Search, Star, Calendar, Tv } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface AnimeResult {
  mal_id: number
  title: string
  title_english?: string
  images: {
    jpg: {
      image_url: string
      large_image_url: string
    }
  }
  synopsis?: string
  score?: number
  type?: string
  episodes?: number
  aired?: {
    from: string
  }
}

export default function AnimeSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AnimeResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/anime?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Error searching anime:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">البحث عن الأنمي</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن أنمي..."
            className="w-full pr-12 pl-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple text-lg"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-anime-purple text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          {loading ? 'جاري البحث...' : 'بحث'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((anime) => (
            <Link
              key={anime.mal_id}
              href={`/anime/${anime.mal_id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
            >
              {anime.images?.jpg?.image_url && (
                <img
                  src={anime.images.jpg.image_url}
                  alt={anime.title}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {anime.title}
                </h3>
                {anime.title_english && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                    {anime.title_english}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {anime.score && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{anime.score}</span>
                    </div>
                  )}
                  {anime.type && (
                    <div className="flex items-center gap-1">
                      <Tv className="w-4 h-4" />
                      <span>{anime.type}</span>
                    </div>
                  )}
                  {anime.aired?.from && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(anime.aired.from).getFullYear()}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {results.length === 0 && query && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">لم يتم العثور على نتائج</p>
        </div>
      )}
    </div>
  )
}


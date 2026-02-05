'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Calendar, Tv, Users, ExternalLink } from 'lucide-react'
import RatingForm from '@/components/RatingForm'
import RatingsList from '@/components/RatingsList'

interface AnimeData {
  mal_id: number
  title: string
  title_english?: string
  title_japanese?: string
  images: {
    jpg: {
      image_url: string
      large_image_url: string
    }
  }
  synopsis?: string
  score?: number
  scored_by?: number
  rank?: number
  popularity?: number
  members?: number
  favorites?: number
  type?: string
  episodes?: number
  status?: string
  aired?: {
    from: string
    to: string
  }
  genres?: Array<{
    mal_id: number
    name: string
  }>
  trailer?: {
    url: string
  }
  streaming?: Array<{
    name: string
    url: string
  }>
}

export default function AnimePageClient() {
  const params = useParams()
  const router = useRouter()
  const animeId = params.id as string
  const [anime, setAnime] = useState<AnimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUserId(data.id)
        } else {
          setUserId(null)
        }
      } catch {
        setUserId(null)
      }
    }

    const fetchAnime = async () => {
      try {
        const response = await fetch(`/api/anime?id=${animeId}`)
        if (response.ok) {
          const data = await response.json()
          setAnime(data)
        }
      } catch (error) {
        console.error('Error fetching anime:', error)
      } finally {
        setLoading(false)
      }
    }

    if (animeId) {
      fetchUser()
      fetchAnime()
    }
  }, [animeId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!anime) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">لم يتم العثور على الأنمي</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-anime-purple to-anime-pink rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            {anime.images?.jpg?.large_image_url && (
              <img
                src={anime.images.jpg.large_image_url}
                alt={anime.title}
                className="w-64 h-96 object-cover rounded-lg shadow-xl"
              />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{anime.title}</h1>
            {anime.title_english && (
              <p className="text-xl text-gray-200 mb-4">{anime.title_english}</p>
            )}
            {anime.title_japanese && (
              <p className="text-lg text-gray-300 mb-6">{anime.title_japanese}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {anime.score && (
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="text-2xl font-bold">{anime.score}</span>
                  </div>
                  <p className="text-sm text-gray-200">التقييم</p>
                </div>
              )}
              {anime.rank && (
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-2xl font-bold mb-1">#{anime.rank}</div>
                  <p className="text-sm text-gray-200">الترتيب</p>
                </div>
              )}
              {anime.popularity && (
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-2xl font-bold mb-1">#{anime.popularity}</div>
                  <p className="text-sm text-gray-200">الشعبية</p>
                </div>
              )}
              {anime.members && (
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5" />
                    <span className="text-xl font-bold">{(anime.members / 1000).toFixed(0)}K</span>
                  </div>
                  <p className="text-sm text-gray-200">الأعضاء</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {anime.type && (
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4" />
                  <span>{anime.type}</span>
                </div>
              )}
              {anime.episodes && (
                <div>
                  <span>{anime.episodes} حلقة</span>
                </div>
              )}
              {anime.status && (
                <div>
                  <span>{anime.status}</span>
                </div>
              )}
              {anime.aired && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(anime.aired.from).getFullYear()}
                    {anime.aired.to && ` - ${new Date(anime.aired.to).getFullYear()}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {anime.synopsis && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">القصة</h2>
              <p className="text-gray-700 leading-relaxed">{anime.synopsis}</p>
            </div>
          )}

          {anime.genres && anime.genres.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">التصنيفات</h2>
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                  <span
                    key={genre.mal_id}
                    className="bg-anime-purple/10 text-anime-purple px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {anime.streaming && anime.streaming.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">روابط المشاهدة الرسمية</h2>
              <div className="space-y-2">
                {anime.streaming.map((stream, index) => (
                  <a
                    key={index}
                    href={stream.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-anime-purple hover:text-anime-pink transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{stream.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <RatingsList animeId={animeId} />
        </div>

        <div className="space-y-6">
          {userId ? (
            <RatingForm animeId={animeId} animeName={anime.title} userId={userId} />
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-700 mb-4">يجب تسجيل الدخول لتقييم هذا الأنمي</p>
              <button
                onClick={() => router.push(`/login?redirect=/anime/${animeId}`)}
                className="bg-anime-purple text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                تسجيل الدخول
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">ناقش هذا الأنمي</h3>
            <a
              href={`/forum/new?anime=${encodeURIComponent(anime.title)}`}
              className="block w-full bg-anime-purple text-white text-center py-3 rounded-lg hover:bg-purple-700 transition"
            >
              إنشاء موضوع جديد
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Star, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Rating {
  id: string
  score: number
  review?: string
  createdAt: Date
  user: {
    name: string | null
    image: string | null
  }
}

interface RatingsListProps {
  animeId: string
}

export default function RatingsList({ animeId }: RatingsListProps) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [averageRating, setAverageRating] = useState<{ average: number; count: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRatings()
  }, [animeId])

  const fetchRatings = async () => {
    try {
      const response = await fetch(`/api/ratings?animeId=${animeId}`)
      const data = await response.json()
      setRatings(data.ratings || [])
      setAverageRating(data.averageRating)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching ratings:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">التقييمات</h2>
        {averageRating && (
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
            <span className="text-2xl font-bold">{averageRating.average?.toFixed(1)}</span>
            <span className="text-gray-500">({averageRating.count} تقييم)</span>
          </div>
        )}
      </div>

      {ratings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">لا توجد تقييمات بعد</p>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="border-b last:border-b-0 pb-4 last:pb-0">
              <div className="flex items-start gap-4">
                {rating.user.image ? (
                  <img
                    src={rating.user.image}
                    alt={rating.user.name || 'User'}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-anime-purple flex items-center justify-center text-white">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {rating.user.name || 'مجهول'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(rating.createdAt), {
                          addSuffix: true
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-bold">{rating.score}/10</span>
                    </div>
                  </div>
                  {rating.review && (
                    <p className="text-gray-700 mt-2">{rating.review}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface RatingFormProps {
  animeId: string
  animeName: string
  userId: string
}

export default function RatingForm({ animeId, animeName, userId }: RatingFormProps) {
  const [score, setScore] = useState(0)
  const [hoveredScore, setHoveredScore] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (score === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          score,
          review,
          animeId,
          animeName,
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setReview('')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">قيم هذا الأنمي</h3>
      
      {submitted ? (
        <div className="text-center py-4">
          <p className="text-green-600 mb-2">شكراً لتقييمك!</p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-anime-purple hover:text-anime-pink text-sm"
          >
            إضافة تقييم آخر
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              التقييم (1-10)
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScore(value)}
                  onMouseEnter={() => setHoveredScore(value)}
                  onMouseLeave={() => setHoveredScore(0)}
                  className={`w-8 h-8 rounded transition ${
                    value <= (hoveredScore || score)
                      ? 'bg-anime-pink text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            {score > 0 && (
              <p className="text-sm text-gray-600 mt-2">قيمته: {score}/10</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مراجعة (اختياري)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple resize-none"
              rows={4}
              placeholder="اكتب مراجعتك هنا..."
            />
          </div>

          <button
            type="submit"
            disabled={score === 0 || loading}
            className="w-full bg-anime-purple text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </button>
        </form>
      )}
    </div>
  )
}


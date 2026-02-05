'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  topicId: string
}

export default function FavoriteButton({ topicId }: FavoriteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/favorites?topicId=${encodeURIComponent(topicId)}`)
        if (!res.ok) {
          setInitialized(true)
          return
        }
        const data = await res.json()
        setFavorited(Boolean(data?.favorited))
      } catch {
      } finally {
        setInitialized(true)
      }
    }

    load()
  }, [topicId])

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
      })

      if (res.status === 401) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
        return
      }

      if (!res.ok) return

      const data = await res.json()
      setFavorited(Boolean(data?.favorited))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || !initialized}
      className={`flex items-center gap-2 transition disabled:opacity-50 ${
        favorited ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
      }`}
      aria-label={favorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
      title={favorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
    >
      <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
      <span className="text-sm">مفضلة</span>
    </button>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'sidebar'
  className?: string
}

interface Ad {
  _id: string
  title: string
  description: string
  image?: string
  link: string
  position: string
  isActive: boolean
}

export default function AdBanner({ position = 'top', className = '' }: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is premium (hide ads for premium users)
    const checkPremium = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setIsPremium(userData.isPremium || false)
        }
      } catch (e) {
        // Ignore
      }
    }

    // Fetch ads from database
    const fetchAd = async () => {
      try {
        const response = await fetch(`/api/ads?position=${position}`)
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0 && data[0].isActive) {
            setAd(data[0])
          }
        }
      } catch (error) {
        console.error('Error fetching ad:', error)
      } finally {
        setLoading(false)
      }
    }

    checkPremium()
    fetchAd()
  }, [position])

  if (!isVisible || isPremium || loading || !ad) return null

  return (
    <div className={`bg-gradient-to-r from-anime-purple to-anime-pink rounded-lg p-4 text-white relative ${className}`}>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 left-2 text-white/80 hover:text-white z-10"
        aria-label="إغلاق الإعلان"
      >
        <X className="w-4 h-4" />
      </button>
      <Link href={ad.link} className="block">
        {ad.image && (
          <img src={ad.image} alt={ad.title} className="w-full h-auto rounded mb-2" />
        )}
        <h4 className="font-semibold mb-1">{ad.title}</h4>
        <p className="text-sm text-white/90">{ad.description}</p>
      </Link>
    </div>
  )
}


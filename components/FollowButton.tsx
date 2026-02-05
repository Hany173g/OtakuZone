'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

interface FollowButtonProps {
  topicId: string
  userId?: string
}

export default function FollowButton({ topicId, userId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      checkFollowStatus()
    }
  }, [userId, topicId])

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/follows?userId=${userId}&topicId=${topicId}`)
      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.follows.length > 0)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!userId) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    try {
      if (isFollowing) {
        const response = await fetch('/api/follows', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, topicId })
        })
        if (response.ok) {
          setIsFollowing(false)
        }
      } else {
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, topicId })
        })
        if (response.ok) {
          setIsFollowing(true)
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!userId) return null

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-anime-purple text-white hover:bg-purple-700'
      } disabled:opacity-50`}
    >
      {isFollowing ? (
        <>
          <BellOff className="w-4 h-4" />
          <span>إلغاء المتابعة</span>
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          <span>متابعة</span>
        </>
      )}
    </button>
  )
}


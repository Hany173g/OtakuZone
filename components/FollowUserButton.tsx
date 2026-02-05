'use client'

import { useState, useEffect } from 'react'
import { UserPlus, UserCheck, Bell, BellOff, Users } from 'lucide-react'

interface FollowUserButtonProps {
  userId: string
  initialFollowing?: boolean
}

export default function FollowUserButton({ userId, initialFollowing = false }: FollowUserButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [notify, setNotify] = useState(false)
  const [isMutualFollow, setIsMutualFollow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const data = await res.json()
        if (data?.id) setCurrentUserId(String(data.id))
      } catch {
        // ignore
      }
    }

    loadMe()
  }, [])

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch(`/api/users/follow?followingId=${userId}`)
        if (!res.ok) return
        const data = await res.json()
        setIsFollowing(Boolean(data?.following))
        setNotify(Boolean(data?.notify))
        setIsMutualFollow(Boolean(data?.isMutualFollow))
      } catch {
        // ignore
      }
    }

    loadStatus()
  }, [userId])

  const handleFollow = async () => {
    if (currentUserId && String(currentUserId) === String(userId)) {
      return
    }
    setLoading(true)
    try {
      if (isFollowing) {
        const response = await fetch(`/api/users/follow?followingId=${userId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setIsFollowing(false)
        }
      } else {
        const response = await fetch('/api/users/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followingId: userId }),
        })
        if (response.ok) {
          const data = await response.json().catch(() => null)
          setIsFollowing(true)
          setNotify(false)
          setIsMutualFollow(Boolean((data as any)?.isMutualFollow))
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNotify = async () => {
    if (!isFollowing) return
    setLoading(true)
    try {
      const response = await fetch('/api/users/follow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId, notify: !notify }),
      })
      if (response.ok) {
        const data = await response.json().catch(() => null)
        setNotify(Boolean((data as any)?.notify))
      }
    } catch (error) {
      console.error('Error toggling notify:', error)
    } finally {
      setLoading(false)
    }
  }

  if (currentUserId && String(currentUserId) === String(userId)) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
          isFollowing
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-anime-purple text-white hover:bg-purple-700'
        }`}
      >
        {isFollowing ? (
          <>
            {isMutualFollow ? <Users className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            <span>{isMutualFollow ? 'أصدقاء' : 'متابع ✓'}</span>
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            <span>متابعة</span>
          </>
        )}
      </button>

      {isFollowing && (
        <button
          type="button"
          onClick={toggleNotify}
          disabled={loading}
          className={`p-2 rounded-lg transition disabled:opacity-50 ${
            notify ? 'bg-anime-pink text-white hover:bg-pink-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title={notify ? 'إيقاف إشعارات البوستات الجديدة' : 'تفعيل إشعارات البوستات الجديدة'}
        >
          {notify ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>
      )}
    </div>
  )
}


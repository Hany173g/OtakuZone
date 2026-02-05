'use client'

import { useState, useEffect } from 'react'
import { Bell, MessageSquare, Eye, Pin } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface FollowedTopic {
  id: string
  topic: {
    id: string
    title: string
    slug: string
    createdAt: Date
    views: number
    isPinned: boolean
    isLocked: boolean
    author: {
      name: string | null
    }
    category: {
      name: string
    }
    _count: {
      comments: number
    }
  }
  createdAt: Date
}

export default function FollowingPage() {
  const [followedTopics, setFollowedTopics] = useState<FollowedTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    setUserId(userId)
    if (userId) {
      fetchFollowedTopics(userId)
    }
  }, [])

  const fetchFollowedTopics = async (userId: string) => {
    try {
      const response = await fetch(`/api/follows?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setFollowedTopics(data.follows || [])
      }
    } catch (error) {
      console.error('Error fetching followed topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const unfollowTopic = async (topicId: string) => {
    if (!userId) return
    
    try {
      const response = await fetch('/api/follows', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, topicId })
      })

      if (response.ok) {
        setFollowedTopics(followedTopics.filter(f => f.topic.id !== topicId))
      }
    } catch (error) {
      console.error('Error unfollowing topic:', error)
    }
  }

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">يرجى تسجيل الدخول لعرض المواضيع المتابعة</p>
          <Link
            href="/login"
            className="inline-block mt-4 text-anime-purple hover:text-anime-pink"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-8 h-8 text-anime-purple" />
        <h1 className="text-4xl font-bold text-gray-800">المواضيع المتابعة</h1>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      ) : followedTopics.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">لا توجد مواضيع متابعة</p>
          <Link
            href="/forum"
            className="text-anime-purple hover:text-anime-pink font-semibold"
          >
            استكشف المنتدى
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {followedTopics.map((follow) => (
            <div
              key={follow.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {follow.topic.isPinned && (
                      <span className="flex items-center gap-1 text-anime-orange text-sm">
                        <Pin className="w-4 h-4" />
                        مثبت
                      </span>
                    )}
                    <span className="text-xs bg-anime-blue/10 text-anime-blue px-2 py-1 rounded">
                      {follow.topic.category.name}
                    </span>
                  </div>
                  <Link
                    href={`/topic/${follow.topic.slug}`}
                    className="text-xl font-semibold text-gray-800 hover:text-anime-purple transition mb-2 block"
                  >
                    {follow.topic.title}
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>بواسطة {follow.topic.author.name || 'مجهول'}</span>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{follow.topic._count.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{follow.topic.views}</span>
                    </div>
                    <span>
                      {formatDistanceToNow(new Date(follow.topic.createdAt), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => unfollowTopic(follow.topic.id)}
                  className="text-red-500 hover:text-red-700 text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition"
                >
                  إلغاء المتابعة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


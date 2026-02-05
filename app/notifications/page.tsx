'use client'

import { useState, useEffect } from 'react'
import { Bell, MessageSquare, Heart, UserPlus, TrendingUp, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  link?: string
  createdAt: Date
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    // In a real app, get userId from session/auth
    const userId = localStorage.getItem('userId') || 'user-id-here'
    fetchNotifications(userId)
  }, [filter])

  const fetchNotifications = async (userId: string) => {
    try {
      const url = filter === 'unread'
        ? `/api/notifications?userId=${userId}&unreadOnly=true`
        : `/api/notifications?userId=${userId}`
      const response = await fetch(url)
      const data = await response.json()
      setNotifications(data.notifications || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read: true })
      })
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const userId = localStorage.getItem('userId') || 'user-id-here'
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-anime-blue" />
      case 'like':
        return <Heart className="w-5 h-5 text-anime-pink" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-anime-purple" />
      case 'mention':
        return <TrendingUp className="w-5 h-5 text-anime-orange" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-anime-purple" />
          <h1 className="text-4xl font-bold text-gray-800">الإشعارات</h1>
          {unreadCount > 0 && (
            <span className="bg-anime-pink text-white px-3 py-1 rounded-full text-sm">
              {unreadCount} غير مقروء
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-anime-purple text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <Check className="w-5 h-5" />
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all'
              ? 'bg-anime-purple text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'unread'
              ? 'bg-anime-purple text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          غير المقروء ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">جاري التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.link || '#'}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id)
                  }
                }}
                className={`block p-6 hover:bg-gray-50 transition ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-3 h-3 bg-anime-pink rounded-full mt-2"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { X, Check, MessageSquare, Heart, UserPlus, TrendingUp, Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { getSocket } from '@/lib/socket-client'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  link?: string
  createdAt: Date
}

interface NotificationDropdownProps {
  userId: string
  onClose: () => void
  onChange?: () => void
}

export default function NotificationDropdown({ userId, onClose, onChange }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  useEffect(() => {
    const socket = getSocket()
    const handler = (n: any) => {
      if (!n?.id) return
      setNotifications((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev
        return [
          {
            id: String(n.id),
            type: String(n.type || ''),
            message: String(n.message || ''),
            read: Boolean(n.read),
            link: n.link ? String(n.link) : undefined,
            createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
          },
          ...prev,
        ]
      })
      onChange?.()
    }

    socket.on('notification:new', handler)
    return () => {
      socket.off('notification:new', handler)
    }
  }, [onChange])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`)
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
      onChange?.()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      onChange?.()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'favorite':
        return <Heart className="w-5 h-5" />
      case 'comment':
      case 'comment_reply':
      case 'message':
        return <MessageSquare className="w-5 h-5" />
      case 'follow':
      case 'user_follow':
      case 'user_follow_back':
        return <UserPlus className="w-5 h-5" />
      case 'mention':
      case 'new_topic':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  return (
    <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">الإشعارات</h3>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-anime-purple hover:text-anime-pink"
            >
              تعليم الكل كمقروء
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">لا توجد إشعارات</div>
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
                  onClose()
                }}
                className={`block p-4 hover:bg-gray-50 transition ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${
                    notification.type === 'like' || notification.type === 'favorite'
                      ? 'text-anime-pink'
                      : notification.type === 'comment' || notification.type === 'comment_reply' || notification.type === 'message'
                        ? 'text-anime-blue'
                        : notification.type === 'user_follow' || notification.type === 'user_follow_back' || notification.type === 'follow'
                          ? 'text-anime-purple'
                          : notification.type === 'new_topic'
                            ? 'text-anime-orange'
                            : 'text-gray-600'
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-anime-pink rounded-full mt-2"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-4 border-t text-center">
          <Link
            href="/notifications"
            className="text-sm text-anime-purple hover:text-anime-pink"
            onClick={onClose}
          >
            عرض جميع الإشعارات
          </Link>
        </div>
      )}
    </div>
  )
}


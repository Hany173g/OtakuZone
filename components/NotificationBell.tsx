'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'
import { getSocket } from '@/lib/socket-client'

interface NotificationBellProps {
  userId?: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!userId) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchUnreadCount()
    const socket = getSocket()
    const handler = (n: any) => {
      if (!n) return
      if (n.read === true) return
      setUnreadCount((c) => c + 1)
    }

    socket.on('notification:new', handler)
    return () => {
      socket.off('notification:new', handler)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    if (isOpen) return
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      } catch {
        // ignore
      }
    }
    fetchUnreadCount()
  }, [isOpen, userId])

  if (!userId) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-anime-purple transition"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-anime-pink text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <NotificationDropdown
          userId={userId}
          onClose={() => setIsOpen(false)}
          onChange={async () => {
            try {
              const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
              const data = await response.json()
              setUnreadCount(data.unreadCount || 0)
            } catch {
              // ignore
            }
          }}
        />
      )}
    </div>
  )
}


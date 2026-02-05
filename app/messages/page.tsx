'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MessageSquare, ArrowRight } from 'lucide-react'

interface Conversation {
  id: string
  otherUser: {
    id: string
    name: string | null
    image: string | null
  } | null
  lastMessage: {
    id: string
    text: string
    senderId: string
    createdAt: string
  } | null
  updatedAt: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/messages/conversations')
        const data = await res.json()
        if (!res.ok) {
          setError(data?.error || 'حدث خطأ')
          setLoading(false)
          return
        }
        setConversations(data?.conversations || [])
        setLoading(false)
      } catch {
        setError('تعذر تحميل المحادثات')
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-8 h-8 text-anime-purple" />
        <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100">الرسائل</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-transparent dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">جاري التحميل...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="p-10 text-center text-gray-500">لا توجد محادثات بعد</div>
        ) : (
          <div className="divide-y dark:divide-slate-800">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="block p-5 hover:bg-gray-50 dark:hover:bg-slate-950 transition"
              >
                <div className="flex items-center gap-4">
                  {c.otherUser?.image ? (
                    <img
                      src={c.otherUser.image}
                      alt={c.otherUser?.name || 'User'}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-anime-purple flex items-center justify-center text-white font-bold">
                      {(c.otherUser?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-gray-800 dark:text-slate-100 truncate">
                        {c.otherUser?.name || 'مستخدم'}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-slate-300 truncate mt-1">
                      {c.lastMessage?.text || 'لا توجد رسائل بعد'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

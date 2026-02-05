'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Send, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getSocket } from '@/lib/socket-client'

interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  createdAt: string
}

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>()
  const router = useRouter()
  const conversationId = params?.conversationId

  const [meId, setMeId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')

  const bottomRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const data = await res.json()
        if (data?.id) setMeId(String(data.id))
      } catch {
        // ignore
      }
    }
    loadMe()
  }, [])

  useEffect(() => {
    if (!conversationId) return

    const load = async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data?.error || 'حدث خطأ')
          setLoading(false)
          if (res.status === 401) {
            router.push('/login')
          }
          return
        }

        setMessages(data?.messages || [])
        setLoading(false)
        setTimeout(scrollToBottom, 50)
      } catch {
        setError('تعذر تحميل الرسائل')
        setLoading(false)
      }
    }

    load()
  }, [conversationId, router])

  const messageIds = useMemo(() => new Set(messages.map((m) => m.id)), [messages])

  useEffect(() => {
    if (!conversationId) return

    const socket = getSocket()
    const handler = (m: any) => {
      if (!m?.id) return
      if (String(m.conversationId) !== String(conversationId)) return
      if (messageIds.has(String(m.id))) return

      setMessages((prev) => [...prev, {
        id: String(m.id),
        conversationId: String(m.conversationId),
        senderId: String(m.senderId),
        text: String(m.text || ''),
        createdAt: m.createdAt ? String(m.createdAt) : new Date().toISOString(),
      }])
      setTimeout(scrollToBottom, 20)
    }

    socket.on('message:new', handler)
    return () => {
      socket.off('message:new', handler)
    }
  }, [conversationId, messageIds])

  const send = async () => {
    const value = text.trim()
    if (!value || !conversationId) return

    setSending(true)
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'تعذر إرسال الرسالة')
        setSending(false)
        return
      }

      setText('')
      // الرسالة هتوصل realtime برضو، لكن نضيفها هنا لو اتأخرت
      if (data?.id && !messageIds.has(String(data.id))) {
        setMessages((prev) => [...prev, {
          id: String(data.id),
          conversationId: String(data.conversationId),
          senderId: String(data.senderId),
          text: String(data.text || ''),
          createdAt: data.createdAt ? String(data.createdAt) : new Date().toISOString(),
        }])
      }
      setTimeout(scrollToBottom, 20)
    } catch {
      setError('تعذر إرسال الرسالة')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-anime-purple transition"
          >
            <ArrowRight className="w-5 h-5" />
            العودة
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-transparent dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800">
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">المحادثة</h1>
          <p className="text-sm text-gray-500 dark:text-slate-300">يتم تطبيق الخصوصية تلقائياً (أصدقاء فقط/تعطيل الرسائل/البلوك)</p>
        </div>

        <div className="h-[60vh] overflow-y-auto p-4 space-y-3" dir="ltr">
          {loading ? (
            <div className="text-center text-gray-500 py-8">جاري التحميل...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">لا توجد رسائل بعد</div>
          ) : (
            messages.map((m) => {
              const mine = meId && String(m.senderId) === String(meId)
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    dir="rtl"
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      mine
                        ? 'bg-anime-purple text-white'
                        : 'bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب رسالة..."
              rows={2}
              className="flex-1 p-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple resize-none bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !text.trim()}
              className="bg-anime-purple text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              إرسال
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

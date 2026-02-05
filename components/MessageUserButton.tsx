'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'

export default function MessageUserButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startConversation = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json().catch(() => null)

      if (res.status === 401) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
        return
      }

      if (!res.ok) {
        setError(data?.error || 'تعذر بدء المحادثة')
        setLoading(false)
        return
      }

      const conversationId = data?.conversation?.id
      if (conversationId) {
        router.push(`/messages/${conversationId}`)
        return
      }

      setError('تعذر بدء المحادثة')
    } catch {
      setError('تعذر بدء المحادثة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startConversation}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-anime-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MessageSquare className="w-5 h-5" />
        {loading ? 'جاري فتح المحادثة...' : 'مراسلة'}
      </button>
      {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
    </div>
  )
}

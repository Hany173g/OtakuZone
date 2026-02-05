'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart, ThumbsDown } from 'lucide-react'

interface LikeButtonProps {
  topicId?: string
  commentId?: string
  groupTopicId?: string
  groupCommentId?: string
  initialLikes: number
  initialDislikes?: number
  layout?: 'row' | 'column'
}

export default function LikeButton({ topicId, commentId, groupTopicId, groupCommentId, initialLikes, initialDislikes = 0, layout = 'row' }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [state, setState] = useState<'none' | 'like' | 'dislike'>('none')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const me = await res.json()
        setUserId(me?.id || null)
      } catch {}
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadState = async () => {
      try {
        if (!topicId && !commentId && !groupTopicId && !groupCommentId) return

        const qs = new URLSearchParams()
        if (topicId) qs.set('topicId', topicId)
        if (commentId) qs.set('commentId', commentId)
        if (groupTopicId) qs.set('groupTopicId', groupTopicId)
        if (groupCommentId) qs.set('groupCommentId', groupCommentId)

        const res = await fetch(`/api/likes?${qs.toString()}`)
        if (!res.ok) return
        const data = await res.json()
        if (data?.state === 'like' || data?.state === 'dislike' || data?.state === 'none') {
          setState(data.state)
        }
      } catch {}
    }

    // only after we know if user is logged in (or confirmed not)
    if (userId !== null) {
      loadState()
    }
  }, [userId, topicId, commentId, groupTopicId, groupCommentId])

  const payloadBase = useMemo(() => {
    const p: any = { topicId, commentId, groupTopicId, groupCommentId }
    return p
  }, [topicId, commentId, groupTopicId, groupCommentId])

  const toggle = async (value: 'like' | 'dislike') => {
    if (!userId) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payloadBase, userId, value }),
      })
      if (!res.ok) return
      const data = await res.json()
      // update counts optimistically based on transitions
      const next: 'none' | 'like' | 'dislike' = data.like ? 'like' : data.dislike ? 'dislike' : 'none'
      // rollback previous
      if (state === 'like') setLikes((x) => Math.max(0, x - 1))
      if (state === 'dislike') setDislikes((x) => Math.max(0, x - 1))
      // apply next
      if (next === 'like') setLikes((x) => x + 1)
      if (next === 'dislike') setDislikes((x) => x + 1)
      setState(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={layout === 'column' ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2'}>
      <button
        onClick={() => toggle('like')}
        disabled={loading}
        className={
          layout === 'column'
            ? `flex items-center gap-2 transition ${
                state === 'like' ? 'text-anime-pink' : 'text-gray-600 hover:text-anime-pink'
              } disabled:opacity-50`
            : `inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
                state === 'like'
                  ? 'border-pink-200 bg-pink-50 text-anime-pink dark:border-pink-900/40 dark:bg-pink-900/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900'
              }`
        }
        aria-label="إعجاب"
      >
        <Heart className={`w-5 h-5 ${state === 'like' ? 'fill-current' : ''}`} />
        <span>{likes}</span>
      </button>
      <button
        onClick={() => toggle('dislike')}
        disabled={loading}
        className={
          layout === 'column'
            ? `flex items-center gap-2 transition ${
                state === 'dislike' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              } disabled:opacity-50`
            : `inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
                state === 'dislike'
                  ? 'border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900'
              }`
        }
        aria-label="عدم إعجاب"
      >
        <ThumbsDown className={`w-5 h-5 ${state === 'dislike' ? 'fill-current' : ''}`} />
        <span>{dislikes}</span>
      </button>
    </div>
  )
}


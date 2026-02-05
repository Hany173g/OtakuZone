'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Reply } from 'lucide-react'
import LikeButton from './LikeButton'
import LinkPreviewList from './LinkPreviewList'

interface GroupComment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    image: string | null
  }
  replies: GroupComment[]
  _count: {
    likes: number
    replies: number
  }
}

export default function GroupCommentSection(props: { groupTopicId: string; isLocked?: boolean }) {
  const { groupTopicId } = props
  const isLocked = Boolean(props.isLocked)

  const [user, setUser] = useState<any>(null)
  const [comments, setComments] = useState<GroupComment[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [draft, setDraft] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const me = await res.json()
        setUser(me)
      } catch {
        // ignore
      }
    }

    const fetchComments = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/groups/comments?groupTopicId=${encodeURIComponent(groupTopicId)}`)
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setComments([])
          return
        }
        setComments(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
    fetchComments()
  }, [groupTopicId])

  const canLoadMore = (parentId: string) => {
    const target = findCommentById(comments, parentId)
    if (!target) return false
    const loaded = target.replies?.length || 0
    const total = target._count?.replies || 0
    return loaded < total
  }

  const toggleExpanded = (id: string) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }))
  }

  const onLoadMore = async (parentId: string) => {
    if (loadingMore[parentId]) return
    setLoadingMore((p) => ({ ...p, [parentId]: true }))
    try {
      const loaded = countLoadedReplies(comments, parentId)
      const res = await fetch(
        `/api/groups/comments/replies?parentId=${encodeURIComponent(parentId)}&skip=${loaded}&limit=5`
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) return
      const newReplies = Array.isArray(data) ? data : []
      setComments((prev) => appendRepliesToTree(prev, parentId, newReplies))
    } finally {
      setLoadingMore((p) => ({ ...p, [parentId]: false }))
    }
  }

  const send = async (parentId?: string) => {
    if (isLocked) return
    if (!user) {
      window.location.href = '/login?redirect=' + window.location.pathname
      return
    }

    const content = parentId ? (replyDrafts[parentId] || '').trim() : draft.trim()
    if (!content) return

    setSending(true)
    try {
      const res = await fetch('/api/groups/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupTopicId, content, parentId }),
      })
      const created = await res.json().catch(() => null)
      if (!res.ok) return

      if (parentId) {
        setComments((prev) => addReplyToTree(prev, parentId, created))
        setReplyDrafts((p) => ({ ...p, [parentId]: '' }))
        setExpanded((p) => ({ ...p, [parentId]: true }))
      } else {
        setComments((prev) => [...prev, created])
        setDraft('')
      }

      setReplyingTo(null)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="text-slate-600 dark:text-slate-300">جاري تحميل التعليقات...</div>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">التعليقات</h2>
      </div>

      {!isLocked ? (
        <div className="mt-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full min-h-[120px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
            placeholder="اكتب تعليقك..."
          />
          <div className="mt-3 flex items-center justify-end">
            <button
              disabled={sending}
              onClick={() => send()}
              className="rounded-xl bg-anime-purple px-5 py-2.5 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              type="button"
            >
              إرسال
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">التعليقات مقفولة على هذا المنشور.</div>
      )}

      <div className="mt-6">
        {comments.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">لا توجد تعليقات بعد.</div>
        ) : (
          <div>
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                depth={0}
                user={user}
                isLocked={isLocked}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyDrafts={replyDrafts}
                setReplyDrafts={setReplyDrafts}
                sending={sending}
                onSendReply={send}
                expanded={expanded}
                toggleExpanded={toggleExpanded}
                loadingMore={loadingMore}
                onLoadMore={onLoadMore}
                canLoadMore={canLoadMore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function addReplyToTree(items: GroupComment[], parentId: string, created: any): GroupComment[] {
  return items.map((c) => {
    if (c.id === parentId) {
      return {
        ...c,
        replies: [...(c.replies || []), created],
        _count: { ...c._count, replies: (c._count?.replies || 0) + 1 },
      }
    }
    if (c.replies && c.replies.length > 0) {
      return {
        ...c,
        replies: addReplyToTree(c.replies, parentId, created),
      }
    }
    return c
  })
}

function appendRepliesToTree(items: GroupComment[], parentId: string, newReplies: GroupComment[]): GroupComment[] {
  return items.map((c) => {
    if (c.id === parentId) {
      const existingIds = new Set((c.replies || []).map((r) => r.id))
      const merged = [...(c.replies || []), ...newReplies.filter((r) => !existingIds.has(r.id))]
      return { ...c, replies: merged }
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: appendRepliesToTree(c.replies, parentId, newReplies) }
    }
    return c
  })
}

function findCommentById(items: GroupComment[], id: string): GroupComment | null {
  for (const c of items) {
    if (c.id === id) return c
    if (c.replies && c.replies.length > 0) {
      const found = findCommentById(c.replies, id)
      if (found) return found
    }
  }
  return null
}

function countLoadedReplies(items: GroupComment[], parentId: string) {
  const c = findCommentById(items, parentId)
  return c?.replies?.length || 0
}

function CommentItem(props: {
  comment: GroupComment
  depth: number
  isLocked: boolean
  user: any
  replyingTo: string | null
  setReplyingTo: (v: string | null) => void
  replyDrafts: Record<string, string>
  setReplyDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>
  sending: boolean
  onSendReply: (parentId: string) => void
  expanded: Record<string, boolean>
  toggleExpanded: (id: string) => void
  loadingMore: Record<string, boolean>
  onLoadMore: (parentId: string) => void
  canLoadMore: (parentId: string) => boolean
}) {
  const {
    comment,
    depth,
    isLocked,
    user,
    replyingTo,
    setReplyingTo,
    replyDrafts,
    setReplyDrafts,
    sending,
    onSendReply,
    expanded,
    toggleExpanded,
    loadingMore,
    onLoadMore,
    canLoadMore,
  } = props

  const maxDepth = 3
  const canReply = depth < maxDepth && !isLocked
  const isExpanded = Boolean(expanded[comment.id])

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isExpanded) return
    if (!canLoadMore(comment.id)) return
    if (loadingMore[comment.id]) return

    const el = loadMoreRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        if (!canLoadMore(comment.id)) return
        if (loadingMore[comment.id]) return
        onLoadMore(comment.id)
      },
      { rootMargin: '200px 0px' }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [isExpanded, comment.id, canLoadMore, loadingMore, onLoadMore])

  return (
    <div className={depth > 0 ? 'mt-3 mr-8 border-r-2 border-slate-200 dark:border-slate-800 pr-4' : ''}>
      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${comment.author.id}`} className="flex-shrink-0">
            <img
              src={comment.author.image || '/default-avatar.svg'}
              alt={comment.author.name || 'User'}
              className="w-10 h-10 rounded-full"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/profile/${comment.author.id}`}
                  className="font-semibold text-slate-900 dark:text-slate-100 hover:text-anime-purple transition"
                >
                  {comment.author.name || 'مجهول'}
                </Link>
                <div className="text-xs text-slate-500 dark:text-slate-300">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LikeButton groupCommentId={comment.id} initialLikes={comment._count.likes} layout="row" />
                {canReply ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        window.location.href = '/login?redirect=' + window.location.pathname
                        return
                      }
                      setReplyingTo(replyingTo === comment.id ? null : comment.id)
                    }}
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-anime-purple text-sm"
                  >
                    <Reply className="w-4 h-4" />
                    رد
                  </button>
                ) : null}
              </div>
            </div>

            <div
              className="prose prose-sm max-w-none text-slate-700 dark:text-slate-100 mt-2 dark:prose-invert break-words"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />

            <LinkPreviewList html={comment.content} />

            {replyingTo === comment.id ? (
              <div className="mt-3">
                <textarea
                  value={replyDrafts[comment.id] || ''}
                  onChange={(e) => setReplyDrafts((p) => ({ ...p, [comment.id]: e.target.value }))}
                  className="w-full min-h-[90px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
                  placeholder="اكتب ردك..."
                />
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => onSendReply(comment.id)}
                    className="rounded-xl bg-anime-purple px-4 py-2 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    إرسال
                  </button>
                </div>
              </div>
            ) : null}

            {comment._count?.replies > 0 ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(comment.id)}
                  className="text-sm text-anime-purple hover:text-anime-pink font-semibold"
                >
                  {isExpanded ? 'إخفاء الردود' : `عرض الردود (${comment._count.replies})`}
                </button>
              </div>
            ) : null}

            {isExpanded ? (
              <div className="mt-3">
                {(comment.replies || []).map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    depth={depth + 1}
                    user={user}
                    isLocked={isLocked}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyDrafts={replyDrafts}
                    setReplyDrafts={setReplyDrafts}
                    sending={sending}
                    onSendReply={onSendReply}
                    expanded={expanded}
                    toggleExpanded={toggleExpanded}
                    loadingMore={loadingMore}
                    onLoadMore={onLoadMore}
                    canLoadMore={canLoadMore}
                  />
                ))}

                {canLoadMore(comment.id) ? (
                  <div ref={loadMoreRef} className="pt-2 text-sm text-slate-500 dark:text-slate-300">
                    {loadingMore[comment.id] ? 'جاري تحميل المزيد...' : ' '}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

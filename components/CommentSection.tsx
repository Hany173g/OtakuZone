'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Heart, Reply, MoreVertical } from 'lucide-react'
import LikeButton from './LikeButton'
import LinkPreviewList from './LinkPreviewList'

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    name: string | null
    image: string | null
    id: string
  }
  replies: Comment[]
  _count: {
    likes: number
    replies: number
  }
}

interface CommentSectionProps {
  topicId: string
  topicAuthorId?: string
  comments: Comment[]
  isLocked: boolean
}

function addReplyToTree(items: Comment[], parentId: string, created: any): Comment[] {
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

function appendRepliesToTree(items: Comment[], parentId: string, newReplies: Comment[]): Comment[] {
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

function findCommentById(items: Comment[], id: string): Comment | null {
  for (const c of items) {
    if (c.id === id) return c
    if (c.replies && c.replies.length > 0) {
      const found = findCommentById(c.replies, id)
      if (found) return found
    }
  }
  return null
}

function countLoadedReplies(items: Comment[], parentId: string) {
  const c = findCommentById(items, parentId)
  return c?.replies?.length || 0
}

function hasMoreReplies(items: Comment[], parentId: string) {
  const c = findCommentById(items, parentId)
  if (!c) return false
  const loaded = c.replies?.length || 0
  const total = c._count?.replies || 0
  return loaded < total
}

function CommentItem(props: {
  comment: Comment
  depth: number
  isLocked: boolean
  user: any
  topicAuthorId?: string
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
    topicAuthorId,
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

  const replyRef = useRef<HTMLTextAreaElement | null>(null)

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

  useEffect(() => {
    if (replyingTo === comment.id) {
      replyRef.current?.focus()
    }
  }, [replyingTo, comment.id])

  return (
    <div className={`${depth > 0 ? 'mr-8 border-r-2 border-gray-200 pr-4' : ''}`}>
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-4 shadow-sm border border-transparent dark:border-slate-800">
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/${comment.author.id}`}
            className="flex-shrink-0"
          >
            <img
              src={comment.author.image || '/default-avatar.svg'}
              alt={comment.author.name || 'User'}
              className="w-10 h-10 rounded-full"
            />
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${comment.author.id}`}
                  className="font-semibold text-gray-800 dark:text-slate-100 hover:text-anime-purple transition"
                >
                  {comment.author.name || 'مجهول'}
                </Link>
                {/* Post Owner Badge */}
                {topicAuthorId && comment.author.id === topicAuthorId && (
                  <span className="bg-anime-purple text-white text-xs px-2 py-0.5 rounded-full">
                    صاحب المنشور
                  </span>
                )}
                <p className="text-xs text-gray-500 dark:text-slate-300">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <LikeButton commentId={comment.id} initialLikes={comment._count.likes} />
                {canReply && (
                  <button
                    onClick={() => {
                      if (!user) {
                        window.location.href = '/login?redirect=' + window.location.pathname
                        return
                      }
                      setReplyingTo(replyingTo === comment.id ? null : comment.id)
                    }}
                    className="flex items-center gap-1 text-gray-600 dark:text-slate-300 hover:text-anime-purple text-sm"
                    type="button"
                  >
                    <Reply className="w-4 h-4" />
                    رد
                  </button>
                )}
              </div>
            </div>

            <div
              className="prose prose-sm max-w-none text-gray-700 dark:text-slate-100 mb-3 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />

            <LinkPreviewList html={comment.content} />

            {comment._count?.replies > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(comment.id)}
                  className="text-sm text-anime-purple hover:text-anime-pink font-semibold"
                >
                  {isExpanded ? 'إخفاء الردود' : `عرض الردود (${comment._count.replies})`}
                </button>
              </div>
            )}

            {isExpanded && (
              <div className="mt-3">
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2">
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        depth={depth + 1}
                        isLocked={isLocked}
                        user={user}
                        topicAuthorId={topicAuthorId}
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
                  </div>
                )}

                {canLoadMore(comment.id) && (
                  <div className="mt-2">
                    <div ref={loadMoreRef} />
                    <div className="text-sm text-gray-500">
                      {loadingMore[comment.id] ? 'جاري التحميل...' : 'مرّر لأسفل لعرض المزيد'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {replyingTo === comment.id && (
              <div className="mb-4 mt-4">
                <textarea
                  ref={replyRef}
                  value={replyDrafts[comment.id] || ''}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({
                      ...prev,
                      [comment.id]: e.target.value,
                    }))
                  }
                  placeholder="اكتب ردك..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => onSendReply(comment.id)}
                    disabled={sending || !(replyDrafts[comment.id] || '').trim()}
                    className="bg-anime-purple text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {sending ? 'جاري الإرسال...' : 'إرسال'}
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyDrafts((prev) => ({ ...prev, [comment.id]: '' }))
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    type="button"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CommentSection({ topicId, topicAuthorId, comments, isLocked }: CommentSectionProps) {
  const [items, setItems] = useState<Comment[]>(comments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({})
  const [user, setUser] = useState<any>(null)
  const [commentContent, setCommentContent] = useState('')
  const [sending, setSending] = useState(false)

  const commentBoxRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        // User not logged in
      }
    }
    checkAuth()
  }, [])

  const handleReply = async (parentId: string) => {
    if (!user) {
      window.location.href = '/login?redirect=' + window.location.pathname
      return
    }

    const replyContent = String(replyDrafts[parentId] || '')
    if (!replyContent.trim()) return

    setSending(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          topicId,
          authorId: user.id,
          parentId,
        })
      })

      if (response.ok) {
        const created = await response.json()
        setItems((prev) => addReplyToTree(prev, parentId, created))
        setReplyDrafts((prev) => ({ ...prev, [parentId]: '' }))
        setReplyingTo(null)
        setExpanded((prev) => ({ ...prev, [parentId]: true }))
      }
    } catch (error) {
      console.error('Error replying:', error)
    } finally {
      setSending(false)
    }
  }

  const handleAddComment = async () => {
    if (!user) {
      window.location.href = '/login?redirect=' + window.location.pathname
      return
    }

    if (!commentContent.trim()) return

    setSending(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentContent,
          topicId,
          authorId: user.id,
        })
      })

      if (response.ok) {
        const created = await response.json()
        setItems((prev) => [...prev, created])
        setCommentContent('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSending(false)
    }
  }

  const canLoadMore = (parentId: string) => hasMoreReplies(items, parentId)

  const toggleExpanded = (id: string) => {
    const next = !Boolean(expanded[id])
    setExpanded((prev) => ({ ...prev, [id]: next }))
    if (next) {
      const alreadyLoaded = countLoadedReplies(items, id)
      if (alreadyLoaded === 0 && hasMoreReplies(items, id)) {
        void loadMoreReplies(id)
      }
    }
  }

  const loadMoreReplies = async (parentId: string) => {
    if (loadingMore[parentId]) return
    setLoadingMore((prev) => ({ ...prev, [parentId]: true }))
    try {
      const skip = countLoadedReplies(items, parentId)
      const res = await fetch(`/api/comments/replies?parentId=${encodeURIComponent(parentId)}&skip=${skip}&limit=10`)
      const data = await res.json()
      if (!res.ok) return
      const newReplies = (data?.replies || []) as Comment[]
      setItems((prev) => appendRepliesToTree(prev, parentId, newReplies))
    } catch {
      // ignore
    } finally {
      setLoadingMore((prev) => ({ ...prev, [parentId]: false }))
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-8 border border-transparent dark:border-slate-800">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
          الردود ({items.length})
        </h2>
        {!isLocked && (
          <button
            type="button"
            onClick={() => {
              if (!user) {
                window.location.href = '/login?redirect=' + window.location.pathname
                return
              }
              commentBoxRef.current?.focus()
            }}
            className="bg-anime-purple text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            اكتب رد
          </button>
        )}
      </div>

      {isLocked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">هذا الموضوع مغلق. لا يمكن إضافة تعليقات جديدة.</p>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">لا توجد تعليقات بعد</p>
      ) : (
        <div className="space-y-4">
          {items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              isLocked={isLocked}
              user={user}
              topicAuthorId={topicAuthorId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
              sending={sending}
              onSendReply={handleReply}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              loadingMore={loadingMore}
              onLoadMore={loadMoreReplies}
              canLoadMore={canLoadMore}
            />
          ))}
        </div>
      )}

      {!isLocked && (
        <div className="mt-8 pt-6 border-t">
          {user ? (
            <>
              <h3 className="text-lg font-semibold mb-4">أضف ردًا على الموضوع</h3>
              <textarea
                ref={commentBoxRef}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                className="w-full p-4 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple resize-none bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                rows={5}
              />
              <button
                onClick={handleAddComment}
                disabled={sending || !commentContent.trim()}
                className="mt-4 bg-anime-purple text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'جاري الإرسال...' : 'إرسال التعليق'}
              </button>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">يجب تسجيل الدخول لإضافة تعليق</p>
              <Link
                href="/login"
                className="inline-block bg-anime-purple text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
              >
                تسجيل الدخول
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


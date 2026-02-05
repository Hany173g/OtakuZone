 'use client'

import Link from 'next/link'
import { MessageSquare, Eye, Pin, Lock, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import LikeButton from './LikeButton'
import { markSeen } from '@/lib/seen'

interface TopicCardProps {
  topic: {
    id: string
    title: string
    slug: string
    content?: string
    imageUrl?: string
    createdAt: Date | string
    views: number
    isPinned: boolean
    isLocked: boolean
    isPopular: boolean
    author?: {
      id?: string
      _id?: string
      name?: string | null
      image?: string | null
    } | null
    authorId?: {
      id?: string
      _id?: string
      name?: string | null
      image?: string | null
    } | null
    category?: {
      name: string
      slug: string
    } | null
    categoryId?: {
      name: string
      slug: string
    } | null
    _count: {
      comments: number
      likes?: number
    }
  }
}

export default function TopicCard({ topic }: TopicCardProps) {
  const categoryName = (topic.category || topic.categoryId)?.name || 'عام'
  const author = topic.author || topic.authorId
  const authorProfileId = (author as any)?.id || (author as any)?._id
  const topicKey = String((topic as any)?.id || (topic as any)?._id)

  const commentCount = topic._count?.comments ?? 0
  const likeCount = topic._count?.likes ?? 0
  const dislikeCount = (topic._count as any)?.dislikes ?? 0

  const rawContent = String(topic.content || '')
  const excerpt = rawContent
    ? rawContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160)
    : ''

  return (
    <div className="group rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition">
      <Link
        href={`/topic/${encodeURIComponent(topic.slug)}`}
        className="block p-4"
        onClick={() => markSeen('topic', topicKey)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap text-xs">
              {topic.isPinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 text-anime-orange px-2 py-1">
                  <Pin className="w-3.5 h-3.5" />
                  مثبت
                </span>
              )}
              {topic.isPopular && (
                <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 text-anime-pink px-2 py-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  شائع
                </span>
              )}
              {topic.isLocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-1 dark:bg-slate-800 dark:text-slate-300">
                  <Lock className="w-3.5 h-3.5" />
                  مغلق
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-anime-blue/10 text-anime-blue px-2 py-1 dark:bg-anime-blue/20">
                {categoryName}
              </span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 shrink-0">
            {formatDistanceToNow(new Date(topic.createdAt), {
              addSuffix: true,
            })}
          </div>
        </div>

        <h3 className="mt-2 text-[17px] md:text-[18px] font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-anime-purple transition break-words">
          {topic.title}
        </h3>

          {topic.imageUrl ? (
            <div className="mt-3 relative h-64 md:h-72 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
              <img
                src={topic.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
              />
              <img
                src={topic.imageUrl}
                alt={topic.title}
                className="relative w-full h-full object-contain"
              />
            </div>
          ) : null}

        {excerpt && (
          <p className="mt-2 text-[14px] md:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 break-words">
            {excerpt}
          </p>
        )}
      </Link>

      <div className="px-4 pb-4 pt-3 border-t border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          {authorProfileId ? (
            <Link href={`/profile/${String(authorProfileId)}`} className="flex items-center gap-2 min-w-0 hover:text-anime-purple transition">
              <img src={author?.image || '/default-avatar.svg'} alt={author?.name || 'User'} className="w-7 h-7 rounded-full" />
              <span className="text-[13px] md:text-sm text-slate-700 dark:text-slate-200 truncate">{author?.name || 'مجهول'}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <img src={author?.image || '/default-avatar.svg'} alt={author?.name || 'User'} className="w-7 h-7 rounded-full" />
              <span className="text-[13px] md:text-sm text-slate-700 dark:text-slate-200 truncate">{author?.name || 'مجهول'}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-[13px] md:text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{commentCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{topic.views}</span>
            </div>
            <LikeButton topicId={topic.id} initialLikes={likeCount} initialDislikes={dislikeCount} layout="row" />
          </div>
        </div>
      </div>
    </div>
  )
}


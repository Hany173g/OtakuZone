'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare } from 'lucide-react'
import LikeButton from './LikeButton'
import { markSeen } from '@/lib/seen'

export default function GroupTopicCard(props: {
  item: {
    id: string
    slug?: string
    title: string
    content?: string
    imageUrl?: string
    type?: string
    categoryId?: { name?: string; slug?: string } | null
    group?: { name?: string; slug?: string; image?: string } | null
    createdAt: string | Date
    isPinned?: boolean
    status?: string
    author?: { id?: string; _id?: string; name?: string | null; image?: string | null } | null
    _count?: { comments?: number; likes?: number; dislikes?: number }
  }
}) {
  const t = props.item
  const createdAt = t.createdAt ? new Date(t.createdAt) : new Date()
  const raw = String(t.content || '')
  const excerpt = raw
    ? raw
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160)
    : ''

  const commentCount = t._count?.comments ?? 0
  const likeCount = t._count?.likes ?? 0
  const dislikeCount = t._count?.dislikes ?? 0
  const categoryName = (t.categoryId as any)?.name || 'عام'

  const href = t.group?.slug && t.slug ? `/groups/${t.group.slug}/posts/${t.slug}` : null
  const authorProfileId = (t.author as any)?.id || (t.author as any)?._id
  const topicKey = String((t as any)?.id || (t as any)?._id)

  return (
    <div className="group rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition">
      {href ? (
        <Link href={href} className="block" onClick={() => markSeen('groupTopic', topicKey)}>
          <div className="p-4 min-w-0">
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {t.isPinned ? (
                    <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded">مثبت</span>
                  ) : null}
                  {t.status === 'pending' ? (
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">قيد المراجعة</span>
                  ) : null}
                  {t.group?.name ? (
                    <span className="text-xs font-semibold bg-anime-purple/10 text-anime-purple px-2 py-1 rounded">
                      {t.group.name}
                    </span>
                  ) : null}
                  <span className="text-xs font-semibold bg-anime-blue/10 text-anime-blue px-2 py-1 rounded">
                    {categoryName}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 shrink-0">
                  {formatDistanceToNow(createdAt, { addSuffix: true })}
                </div>
              </div>

              <h3 className="mt-2 font-bold text-[17px] md:text-[18px] text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-anime-purple transition break-words">
                {t.title}
              </h3>

              {t.imageUrl ? (
                <div className="mt-3 relative h-64 md:h-72 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                  <img
                    src={t.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
                  />
                  <img src={t.imageUrl} alt={t.title} className="relative w-full h-full object-contain" />
                </div>
              ) : null}

              {excerpt ? (
                <p className="mt-2 text-[14px] md:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 break-words">{excerpt}</p>
              ) : null}
            </div>
          </div>
        </Link>
      ) : (
        <div className="p-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {t.isPinned ? (
                  <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded">مثبت</span>
                ) : null}
                {t.status === 'pending' ? (
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">قيد المراجعة</span>
                ) : null}
                {t.group?.name ? (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold bg-anime-purple/10 text-anime-purple px-2 py-1 rounded">
                    {t.group.image ? (
                      <img src={t.group.image} alt={t.group.name} className="w-4 h-4 rounded-full" />
                    ) : null}
                    <span className="truncate max-w-[140px]">{t.group.name}</span>
                  </span>
                ) : null}
                <span className="text-xs font-semibold bg-anime-blue/10 text-anime-blue px-2 py-1 rounded">
                  {categoryName}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 shrink-0">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </div>
            </div>

            <h3 className="mt-2 font-bold text-[17px] md:text-[18px] text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-anime-purple transition break-words">
              {t.title}
            </h3>

            {t.imageUrl ? (
              <div className="mt-3 relative h-64 md:h-72 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                <img
                  src={t.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
                />
                <img src={t.imageUrl} alt={t.title} className="relative w-full h-full object-contain" />
              </div>
            ) : null}

            {excerpt ? (
              <p className="mt-2 text-[14px] md:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 break-words">{excerpt}</p>
            ) : null}
          </div>
        </div>
      )}

      <div className="px-4 pb-4 pt-3 border-t border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {authorProfileId ? (
              <Link
                href={`/profile/${String(authorProfileId)}`}
                className="flex items-center gap-2 min-w-0 hover:text-anime-purple transition"
              >
                <img src={t.author?.image || '/default-avatar.svg'} alt={t.author?.name || 'User'} className="w-7 h-7 rounded-full" />
                <span className="text-[13px] md:text-sm text-slate-700 dark:text-slate-200 truncate">{t.author?.name || 'مستخدم'}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <img src={t.author?.image || '/default-avatar.svg'} alt={t.author?.name || 'User'} className="w-7 h-7 rounded-full" />
                <span className="text-[13px] md:text-sm text-slate-700 dark:text-slate-200 truncate">{t.author?.name || 'مستخدم'}</span>
              </div>
            )}

            <span className="mx-2 h-4 w-px bg-slate-200/70 dark:bg-slate-800" />

            <div className="text-[13px] md:text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{commentCount}</span>
            </div>
          </div>

          <LikeButton groupTopicId={t.id} initialLikes={likeCount} initialDislikes={dislikeCount} layout="row" />
        </div>
      </div>
    </div>
  )
}

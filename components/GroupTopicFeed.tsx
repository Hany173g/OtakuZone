'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import GroupTopicCard from './GroupTopicCard'
import { readSeen } from '@/lib/seen'

type TopicItem = any

type FeedStatus = 'published' | 'pending'

export default function GroupTopicFeed(props: {
  groupId: string
  initialItems?: TopicItem[]
  status?: FeedStatus
  className?: string
}) {
  const { groupId, initialItems = [], status = 'published', className } = props

  const [items, setItems] = useState<TopicItem[]>(initialItems)
  const [skip, setSkip] = useState<number>(initialItems.length)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)

  const [seen, setSeen] = useState<Set<string>>(new Set())

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    p.set('groupId', groupId)
    p.set('status', status)
    p.set('limit', '10')
    return p
  }, [groupId, status])

  const initialKey = useMemo(() => {
    return initialItems.map((it: any) => String(it?.id || it?._id)).join(',')
  }, [initialItems])

  useEffect(() => {
    setItems(initialItems)
    setSkip(initialItems.length)
    setHasMore(true)
  }, [qs.toString(), initialKey])

  useEffect(() => {
    const refresh = () => setSeen(readSeen('groupTopic'))
    refresh()

    const onSeenChanged = (e: any) => {
      if (e?.detail?.kind && e.detail.kind !== 'groupTopic') return
      refresh()
    }

    window.addEventListener('oz_seen_changed', onSeenChanged as any)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('oz_seen_changed', onSeenChanged as any)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const visibleItems = useMemo(() => {
    if (items.length === 0) return []
    const unseen = items.filter((t: any) => !seen.has(String(t?.id || t?._id)))
    return unseen.length > 0 ? unseen : items
  }, [items, seen])

  const loadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const params = new URLSearchParams(qs)
      params.set('skip', String(skip))

      const res = await fetch(`/api/groups/topics?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setHasMore(false)
        return
      }

      const newItems = (data?.items || []) as TopicItem[]
      setItems((prev) => {
        const existing = new Set(prev.map((t: any) => String(t?.id || t?._id)))
        const merged = [...prev]
        for (const it of newItems) {
          const key = String(it?.id || it?._id)
          if (!existing.has(key)) merged.push(it)
        }
        return merged
      })

      setSkip(Number(data?.nextSkip ?? skip + newItems.length))
      setHasMore(Boolean(data?.hasMore))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!sentinelRef.current) return
    if (!hasMore) return

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        void loadMore()
      },
      { rootMargin: '300px 0px' }
    )

    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, skip, qs.toString(), loading])

  useEffect(() => {
    if (loading) return
    if (!hasMore) return
    if (items.length === 0) return

    const unseenCount = items.filter((t: any) => !seen.has(String(t?.id || t?._id))).length
    if (unseenCount === 0) {
      void loadMore()
    }
  }, [items, seen, hasMore, loading])

  return (
    <div className={className || 'space-y-5'}>
      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <p className="text-slate-600 dark:text-slate-300 text-lg">لا توجد منشورات بعد</p>
        </div>
      ) : (
        visibleItems.map((it: any) => <GroupTopicCard key={String(it?.id || it?._id)} item={it} />)
      )}

      {hasMore && (
        <div className="py-6">
          <div ref={sentinelRef} />
          <div className="text-center text-sm text-slate-500">{loading ? 'جاري التحميل...' : ''}</div>
        </div>
      )}
    </div>
  )
}

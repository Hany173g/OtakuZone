'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import TopicCard from './TopicCard'
import { readSeen, clearSeen } from '@/lib/seen'

type FeedFilter = 'popular' | 'pinned' | undefined
type SortOption = 'new' | 'popular' | 'trending' | 'most_liked'

type TopicItem = any

export default function TopicFeed(props: {
  initialItems?: TopicItem[]
  filter?: FeedFilter
  category?: string
  type?: string
  sort?: SortOption
  className?: string
}) {
  const { initialItems = [], filter, category, type, sort = 'new', className } = props

  const [items, setItems] = useState<TopicItem[]>(initialItems)
  const [skip, setSkip] = useState<number>(initialItems.length)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [currentSort, setCurrentSort] = useState<SortOption>(sort)

  // Track seen posts to prevent duplicates
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [allLoadedIds, setAllLoadedIds] = useState<Set<string>>(new Set())

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (filter) p.set('filter', filter)
    if (category) p.set('category', category)
    if (type) p.set('type', type)
    p.set('sort', currentSort)
    p.set('limit', '10')
    return p
  }, [filter, category, type, currentSort])

  useEffect(() => {
    // Reset when query changes
    setItems(initialItems)
    setSkip(initialItems.length)
    setHasMore(true)
    setAllLoadedIds(new Set(initialItems.map((t: any) => String(t?.id || t?._id))))
  }, [qs.toString()])

  useEffect(() => {
    const refresh = () => setSeen(readSeen('topic'))
    refresh()

    const onSeenChanged = (e: any) => {
      if (e?.detail?.kind && e.detail.kind !== 'topic') return
      refresh()
    }

    window.addEventListener('oz_seen_changed', onSeenChanged as any)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('oz_seen_changed', onSeenChanged as any)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // Deduplication: only show items that haven't been loaded before
  // Unless we've gone through all items, then clear and start fresh
  const visibleItems = useMemo(() => {
    if (items.length === 0) return []
    
    // Filter out duplicates based on allLoadedIds
    const uniqueItems = items.filter((t: any) => {
      const id = String(t?.id || t?._id)
      return !allLoadedIds.has(id) || allLoadedIds.size <= items.length
    })
    
    // If all items are seen/loaded, clear and show all (cycle through)
    if (uniqueItems.length === 0 && items.length > 0) {
      // Clear seen and start fresh
      clearSeen('topic')
      setSeen(new Set())
      return items
    }
    
    return uniqueItems
  }, [items, allLoadedIds])

  const loadMore = async () => {
    if (loading) return
    if (!hasMore) return

    setLoading(true)
    try {
      const params = new URLSearchParams(qs)
      params.set('skip', String(skip))

      const res = await fetch(`/api/topics/feed?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setHasMore(false)
        return
      }

      const newItems = (data?.items || []) as TopicItem[]
      
      // Deduplicate against already loaded items
      setItems((prev) => {
        const existing = new Set(prev.map((t: any) => String(t?.id || t?._id)))
        const merged = [...prev]
        const newIds = new Set<string>()
        
        for (const it of newItems) {
          const key = String(it?.id || it?._id)
          if (!existing.has(key)) {
            merged.push(it)
            newIds.add(key)
          }
        }
        
        // Update allLoadedIds
        setAllLoadedIds((prevIds) => {
          const updated = new Set(prevIds)
          newIds.forEach((id) => updated.add(id))
          return updated
        })
        
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

  // Auto-load more when all visible items are seen
  useEffect(() => {
    if (loading) return
    if (!hasMore) return
    if (items.length === 0) return

    const unseenCount = items.filter((t: any) => !seen.has(String(t?.id || t?._id))).length
    if (unseenCount === 0 && visibleItems.length === 0) {
      void loadMore()
    }
  }, [items, seen, hasMore, loading, visibleItems.length])

  return (
    <div className={className || 'space-y-5'}>
      {/* Sort Options */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'new', label: 'جديد' },
          { key: 'popular', label: 'الأكثر مشاهدة' },
          { key: 'trending', label: 'الأكثر تفاعلاً' },
          { key: 'most_liked', label: 'الأكثر إعجاباً' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setCurrentSort(opt.key as SortOption)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              currentSort === opt.key
                ? 'bg-anime-purple text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <p className="text-slate-600 dark:text-slate-300 text-lg">لا توجد مواضيع بعد</p>
        </div>
      ) : (
        visibleItems.map((topic: any) => <TopicCard key={String(topic?.id || topic?._id)} topic={topic} />)
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

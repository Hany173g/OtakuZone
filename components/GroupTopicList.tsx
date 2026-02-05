'use client'

import { useEffect, useMemo, useState } from 'react'
import GroupTopicCard from './GroupTopicCard'
import { readSeen } from '@/lib/seen'

type TopicItem = any

export default function GroupTopicList(props: { items: TopicItem[]; className?: string }) {
  const [seen, setSeen] = useState<Set<string>>(new Set())

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

  const visible = useMemo(() => {
    const list = props.items || []
    if (list.length === 0) return []

    const unseen = list.filter((it: any) => !seen.has(String(it?.id || it?._id)))
    return unseen.length > 0 ? unseen : list
  }, [props.items, seen])

  return (
    <div className={props.className || 'space-y-5'}>
      {visible.map((it: any) => (
        <GroupTopicCard key={String(it?.id || it?._id)} item={it} />
      ))}
    </div>
  )
}

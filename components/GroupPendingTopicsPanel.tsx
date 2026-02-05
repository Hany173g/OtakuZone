'use client'

import { useEffect, useState } from 'react'

type PendingItem = {
  id: string
  title: string
  createdAt?: string
  author?: { name?: string | null; image?: string | null } | null
}

export default function GroupPendingTopicsPanel(props: { groupId: string }) {
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const p = new URLSearchParams()
      p.set('groupId', props.groupId)
      p.set('status', 'pending')
      p.set('limit', '20')
      const res = await fetch(`/api/groups/topics?${p.toString()}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'تعذر جلب المنشورات')

      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e: any) {
      setError(e?.message || 'تعذر جلب المنشورات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.groupId])

  const moderate = async (topicId: string, action: 'approve' | 'reject') => {
    setBusyId(topicId)
    try {
      const res = await fetch('/api/groups/topics/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: props.groupId, topicId, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'تعذر تنفيذ العملية')

      setItems((prev) => prev.filter((p) => p.id !== topicId))
    } catch (e: any) {
      alert(e?.message || 'حدث خطأ')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-gray-800 font-bold">مراجعة المنشورات</p>
          <p className="text-gray-600 text-sm mt-1">المنشورات التي تنتظر موافقة المشرف.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="text-sm font-semibold text-anime-purple hover:text-anime-pink transition"
        >
          تحديث
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-gray-600">جارٍ التحميل...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">لا توجد منشورات قيد المراجعة.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((it) => {
            const isBusy = busyId === it.id
            return (
              <div key={it.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{it.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{it.author?.name || 'مستخدم'}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => moderate(it.id, 'approve')}
                      className={
                        isBusy
                          ? 'px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold cursor-not-allowed'
                          : 'px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition'
                      }
                    >
                      قبول
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => moderate(it.id, 'reject')}
                      className={
                        isBusy
                          ? 'px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold cursor-not-allowed'
                          : 'px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition'
                      }
                    >
                      رفض
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

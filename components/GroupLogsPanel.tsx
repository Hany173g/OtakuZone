'use client'

import { useEffect, useState } from 'react'

type LogItem = {
  id: string
  action: string
  createdAt: string | null
  actor: { id: string; name: string | null; image: string | null } | null
}

export default function GroupLogsPanel(props: { groupId: string }) {
  const [items, setItems] = useState<LogItem[]>([])
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async (mode: 'reset' | 'more') => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('groupId', props.groupId)
      params.set('limit', '20')
      params.set('skip', String(mode === 'more' ? skip : 0))

      const res = await fetch(`/api/groups/logs?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'تعذر تحميل السجل')

      const newItems = (data?.items || []) as LogItem[]

      setItems((prev) => (mode === 'more' ? [...prev, ...newItems] : newItems))
      setSkip(Number(data?.nextSkip ?? (mode === 'more' ? skip + newItems.length : newItems.length)))
      setHasMore(Boolean(data?.hasMore))
    } catch (e: any) {
      setError(e?.message || 'تعذر تحميل السجل')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load('reset')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.groupId])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-slate-900 dark:text-slate-100 font-bold">سجل الإدارة</p>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">أحدث الإجراءات داخل المجتمع.</p>
        </div>
        <button
          type="button"
          onClick={() => load('reset')}
          className="text-sm font-semibold text-anime-purple hover:text-anime-pink transition"
        >
          تحديث
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {items.map((l) => {
          const name = l.actor?.name || 'مستخدم'
          const img = l.actor?.image
          return (
            <div key={l.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {img ? (
                  <img src={img} alt={name} className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-anime-purple text-white flex items-center justify-center font-bold">
                    {name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{l.action}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{name}</div>
                </div>
              </div>

              <div className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                {l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}
              </div>
            </div>
          )
        })}

        {loading ? <p className="text-sm text-slate-500">جارٍ التحميل...</p> : null}

        {!loading && items.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">لا توجد بيانات.</p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-end">
        {hasMore ? (
          <button
            type="button"
            onClick={() => load('more')}
            disabled={loading}
            className={
              loading
                ? 'px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-not-allowed'
                : 'px-4 py-2 rounded-lg bg-anime-purple text-white font-semibold hover:bg-purple-700 transition'
            }
          >
            تحميل المزيد
          </button>
        ) : (
          <span className="text-sm text-slate-500">تم عرض كل النتائج</span>
        )}
      </div>
    </div>
  )
}

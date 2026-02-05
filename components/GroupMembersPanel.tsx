'use client'

import { useEffect, useMemo, useState } from 'react'

type Item = {
  id: string
  role: string
  status: string
  joinedAt: string | null
  user: { id: string; name: string | null; image: string | null } | null
}

export default function GroupMembersPanel(props: { groupId: string }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryKey = useMemo(() => q.trim(), [q])

  const load = async (mode: 'reset' | 'more') => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('groupId', props.groupId)
      params.set('limit', '20')
      params.set('skip', String(mode === 'more' ? skip : 0))
      if (queryKey) params.set('q', queryKey)

      const res = await fetch(`/api/groups/members?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'تعذر تحميل الأعضاء')

      const newItems = (data?.items || []) as Item[]

      setItems((prev) => (mode === 'more' ? [...prev, ...newItems] : newItems))
      setSkip(Number(data?.nextSkip ?? (mode === 'more' ? skip + newItems.length : newItems.length)))
      setHasMore(Boolean(data?.hasMore))
    } catch (e: any) {
      setError(e?.message || 'تعذر تحميل الأعضاء')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load('reset')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.groupId, queryKey])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-slate-900 dark:text-slate-100 font-bold">الأعضاء</p>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">بحث سريع مع تحميل تدريجي للأعضاء.</p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالاسم..."
          className="w-full sm:w-64 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
        />
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {items.map((m) => {
          const name = m.user?.name || 'مستخدم'
          const img = m.user?.image
          return (
            <div key={m.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {img ? (
                  <img src={img} alt={name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-anime-purple text-white flex items-center justify-center font-bold">
                    {name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{m.role}</div>
                </div>
              </div>

              <div className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                {m.status}
              </div>
            </div>
          )
        })}

        {loading ? <p className="text-sm text-slate-500">جارٍ التحميل...</p> : null}

        {!loading && items.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">لا يوجد أعضاء مطابقون.</p>
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

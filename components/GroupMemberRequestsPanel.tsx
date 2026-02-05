'use client'

import { useEffect, useState } from 'react'

type RequestItem = {
  id: string
  userId?: string
  user?: {
    _id?: string
    name?: string
    image?: string
  }
  createdAt?: string
}

export default function GroupMemberRequestsPanel(props: { groupId: string }) {
  const [items, setItems] = useState<RequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/groups/member-requests?groupId=${encodeURIComponent(props.groupId)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'تعذر جلب الطلبات')
      }
      setItems(Array.isArray(data?.requests) ? data.requests : [])
    } catch (e: any) {
      setError(e?.message || 'تعذر جلب الطلبات')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.groupId])

  const act = async (userId: string, action: 'approve' | 'deny') => {
    setBusyUserId(userId)
    try {
      const res = await fetch('/api/groups/member-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: props.groupId, userId, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'تعذر تنفيذ العملية')
      }

      setItems((prev) => prev.filter((i) => (i.userId || i.user?._id) !== userId))
    } catch (e: any) {
      alert(e?.message || 'حدث خطأ')
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800">طلبات الانضمام</h3>
        <button
          type="button"
          onClick={load}
          className="text-sm font-semibold text-anime-purple hover:text-anime-pink transition"
        >
          تحديث
        </button>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-gray-600">جارٍ التحميل...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">لا توجد طلبات قيد الانتظار.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const uid = (item.userId || item.user?._id || '').toString()
            const name = item.user?.name || 'مستخدم'
            const img = item.user?.image
            const isBusy = busyUserId === uid

            return (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  {img ? (
                    <img src={img} alt={name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-anime-purple text-white flex items-center justify-center font-bold">
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{name}</div>
                    <div className="text-xs text-gray-500">طلب انضمام</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!uid || isBusy}
                    onClick={() => act(uid, 'approve')}
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
                    disabled={!uid || isBusy}
                    onClick={() => act(uid, 'deny')}
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
            )
          })}
        </div>
      )}
    </div>
  )
}

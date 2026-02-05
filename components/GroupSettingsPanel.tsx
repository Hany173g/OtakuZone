'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SettingsPayload = {
  group: {
    id: string
    name: string
    slug: string
    description: string
    image: string
    coverImage: string
    isPublic: boolean
    isApprovalRequired: boolean
    settings: {
      postApprovalRequired: boolean
      allowAnonymousPosts: boolean
    }
  }
}

export default function GroupSettingsPanel(props: { groupId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SettingsPayload | null>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/groups/settings?groupId=${encodeURIComponent(props.groupId)}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'تعذر تحميل الإعدادات')
      setData(json)
    } catch (e: any) {
      setError(e?.message || 'تعذر تحميل الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.groupId])

  const save = async () => {
    if (!data) return
    setSaving(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.set('groupId', data.group.id)
      fd.set('name', data.group.name)
      fd.set('description', data.group.description || '')
      fd.set('isPublic', String(data.group.isPublic))
      fd.set('isApprovalRequired', String(data.group.isApprovalRequired))
      fd.set('postApprovalRequired', String(data.group.settings.postApprovalRequired))
      fd.set('allowAnonymousPosts', String(data.group.settings.allowAnonymousPosts))

      if (imageFile) fd.set('image', imageFile)
      if (coverFile) fd.set('coverImage', coverFile)

      const res = await fetch('/api/groups/settings', { method: 'PATCH', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'تعذر حفظ الإعدادات')

      setImageFile(null)
      setCoverFile(null)

      await load()
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'تعذر حفظ الإعدادات')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6">
        <p className="text-slate-600 dark:text-slate-300">جارٍ التحميل...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-3 px-4 py-2 rounded-lg bg-anime-purple text-white font-semibold hover:bg-purple-700 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-slate-900 dark:text-slate-100 font-bold">إعدادات المجتمع</p>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">تعديل بيانات المجتمع وإعدادات النشر.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">اسم المجتمع</label>
          <input
            value={data.group.name}
            onChange={(e) => setData({ ...data, group: { ...data.group, name: e.target.value } })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">الخصوصية</label>
          <select
            value={data.group.isPublic ? 'public' : 'private'}
            onChange={(e) => setData({ ...data, group: { ...data.group, isPublic: e.target.value === 'public' } })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
          >
            <option value="public">عام</option>
            <option value="private">خاص</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">وصف المجتمع</label>
          <textarea
            value={data.group.description}
            onChange={(e) => setData({ ...data, group: { ...data.group, description: e.target.value } })}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">الانضمام</label>
          <select
            value={data.group.isApprovalRequired ? 'approval' : 'open'}
            onChange={(e) => setData({ ...data, group: { ...data.group, isApprovalRequired: e.target.value === 'approval' } })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
          >
            <option value="open">مفتوح</option>
            <option value="approval">يتطلب موافقة</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">إعدادات النشر</label>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={data.group.settings.postApprovalRequired}
                onChange={(e) =>
                  setData({
                    ...data,
                    group: {
                      ...data.group,
                      settings: { ...data.group.settings, postApprovalRequired: e.target.checked },
                    },
                  })
                }
              />
              موافقة قبل نشر المنشورات
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={data.group.settings.allowAnonymousPosts}
                onChange={(e) =>
                  setData({
                    ...data,
                    group: {
                      ...data.group,
                      settings: { ...data.group.settings, allowAnonymousPosts: e.target.checked },
                    },
                  })
                }
              />
              السماح بالنشر كمجهول
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">تغيير صورة المجتمع</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">تغيير صورة الغلاف</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={
            saving
              ? 'px-5 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-not-allowed'
              : 'px-5 py-2 rounded-lg bg-anime-purple text-white font-semibold hover:bg-purple-700 transition'
          }
        >
          {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  )
}

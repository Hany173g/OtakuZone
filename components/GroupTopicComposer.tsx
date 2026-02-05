'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GroupTopicComposer(props: {
  groupId: string
  allowAnonymousPosts: boolean
  postApprovalRequired: boolean
  isLoggedIn: boolean
  isMember: boolean
  onCreated?: (status: 'published' | 'pending') => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [anonymousName, setAnonymousName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null)

  const canPost = props.isLoggedIn && props.isMember

  const helper = useMemo(() => {
    if (!props.isLoggedIn) return 'سجّل الدخول أولاً لإنشاء منشور.'
    if (!props.isMember) return 'يلزم الانضمام للمجتمع قبل النشر.'
    if (!props.postApprovalRequired) return 'سيظهر منشورك فورًا بعد النشر.'
    return 'قد يحتاج منشورك لمراجعة المشرف قبل ظهوره للجميع.'
  }, [props.isLoggedIn, props.isMember, props.postApprovalRequired])

  useEffect(() => {
    const load = async () => {
      setCategoriesLoading(true)
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' })
        const data = await res.json().catch(() => [])
        if (res.ok && Array.isArray(data)) {
          setCategories(data)
        }
      } finally {
        setCategoriesLoading(false)
      }
    }

    if (props.isLoggedIn) {
      load()
    }
  }, [props.isLoggedIn])

  const uploadImage = async (file: File) => {
    setUploadingImage(true)
    setMessage(null)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await fetch('/api/uploads/image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ type: 'error', text: data?.error || 'تعذر رفع الصورة' })
        return
      }
      setImageUrl(String(data?.url || ''))
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'تعذر رفع الصورة' })
    } finally {
      setUploadingImage(false)
    }
  }

  const submit = async () => {
    if (!canPost) return
    if (submitting) return

    if (!type) {
      setMessage({ type: 'error', text: 'يجب اختيار النوع (أنمي/مانجا/مانهوا)' })
      return
    }

    if (!categoryId) {
      setMessage({ type: 'error', text: 'يجب اختيار التصنيف' })
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/groups/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: props.groupId,
          title,
          content,
          type,
          categoryId,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          isAnonymous: props.allowAnonymousPosts ? isAnonymous : false,
          anonymousName: props.allowAnonymousPosts && isAnonymous ? anonymousName : undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ type: 'error', text: data?.error || 'تعذر إنشاء المنشور' })
        return
      }

      setTitle('')
      setContent('')
      setType('')
      setCategoryId('')
      setImageUrl('')
      setVideoUrl('')
      setIsAnonymous(false)
      setAnonymousName('')

      router.refresh()

      if (data?.item?.status === 'pending' || data?.item?.status === 'published') {
        props.onCreated?.(data.item.status)

        if (data.item.status === 'pending') {
          setMessage({ type: 'info', text: 'تم إرسال المنشور للمراجعة وسيظهر بعد موافقة المشرف.' })
        } else {
          setMessage({ type: 'success', text: 'تم نشر المنشور بنجاح.' })
        }
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'حدث خطأ' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-slate-900 dark:text-slate-100 font-bold">إنشاء منشور</p>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{helper}</p>
        </div>
      </div>

      {message ? (
        <div
          className={
            message.type === 'error'
              ? 'mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900'
              : message.type === 'success'
                ? 'mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-900'
                : 'mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900'
          }
        >
          {message.text}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">النوع <span className="text-red-500">*</span></label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                if (message?.type === 'error') setMessage(null)
              }}
              disabled={!canPost || submitting}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
            >
              <option value="">اختر النوع</option>
              <option value="anime">أنمي</option>
              <option value="manga">مانجا</option>
              <option value="manhwa">مانهوا</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">التصنيف <span className="text-red-500">*</span></label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                if (message?.type === 'error') setMessage(null)
              }}
              disabled={!canPost || submitting || categoriesLoading}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
            >
              <option value="">{categoriesLoading ? 'جاري التحميل...' : 'اختر التصنيف'}</option>
              {categories.map((c: any) => (
                <option key={String(c?._id || c?.id)} value={String(c?._id || c?.id)}>
                  {c?.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (message?.type === 'error') setMessage(null)
          }}
          placeholder="عنوان المنشور"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
          disabled={!canPost || submitting}
        />

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">صورة (اختياري)</label>
          {imageUrl ? (
            <div className="mb-3 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800">
              <img src={imageUrl} alt="preview" className="w-full max-h-72 object-cover" />
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <input
              type="file"
              accept="image/*"
              disabled={!canPost || submitting || uploadingImage}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                if (videoUrl) {
                  setMessage({ type: 'error', text: 'لا يمكن الجمع بين صورة وفيديو في نفس المنشور' })
                  return
                }
                void uploadImage(f)
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
            {imageUrl ? (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                disabled={!canPost || submitting || uploadingImage}
                className="shrink-0 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold"
              >
                إزالة
              </button>
            ) : null}
          </div>
          {uploadingImage ? <p className="mt-2 text-sm text-slate-500">جارٍ رفع الصورة...</p> : null}
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">رابط فيديو (اختياري)</label>
          <input
            value={videoUrl}
            onChange={(e) => {
              const next = e.target.value
              if (imageUrl && next) {
                setMessage({ type: 'error', text: 'لا يمكن الجمع بين صورة وفيديو في نفس المنشور' })
                return
              }
              setVideoUrl(next)
              if (message?.type === 'error') setMessage(null)
            }}
            placeholder="ضع رابط YouTube أو Vimeo"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
            disabled={!canPost || submitting}
          />
          <p className="mt-2 text-xs text-slate-500">سيظهر الفيديو داخل المنشور كـ iframe.</p>
        </div>

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (message?.type === 'error') setMessage(null)
          }}
          placeholder="اكتب محتوى المنشور..."
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple resize-none"
          disabled={!canPost || submitting}
        />

        {props.allowAnonymousPosts && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                disabled={!canPost || submitting}
              />
              نشر كمجهول
            </label>

            {isAnonymous && (
              <div className="mt-2">
                <input
                  value={anonymousName}
                  onChange={(e) => setAnonymousName(e.target.value)}
                  placeholder="اسم مستعار (اختياري)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-anime-purple"
                  disabled={!canPost || submitting}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={!canPost || submitting}
            className={
              !canPost || submitting
                ? 'px-5 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-not-allowed'
                : 'px-5 py-2 rounded-lg bg-anime-purple text-white font-semibold hover:bg-purple-700 transition'
            }
          >
            {submitting ? 'جارٍ النشر...' : 'نشر'}
          </button>
        </div>
      </div>
    </div>
  )
}

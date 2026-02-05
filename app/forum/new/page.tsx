'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function NewTopicPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: '', // النوع: أنمي، مانجا، مانهوا
    category: '',
    imageUrl: '',
    videoUrl: ''
  })
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const contentTypes = [
    { value: 'anime', label: 'أنمي' },
    { value: 'manga', label: 'مانجا' },
    { value: 'manhwa', label: 'مانهوا' },
  ]

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          router.push('/login?redirect=/forum/new')
        }
      } catch (error) {
        router.push('/login?redirect=/forum/new')
      } finally {
        setLoading(false)
      }
    }

    // Fetch categories
    const fetchCategories = async () => {
      setCategoriesLoading(true)
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        
        if (response.ok && data && Array.isArray(data)) {
          console.log('Categories fetched:', data)
          setCategories(data)
        } else {
          console.error('Failed to fetch categories:', data)
          setError('فشل تحميل التصنيفات. يرجى تحديث الصفحة.')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError('حدث خطأ في تحميل التصنيفات')
      } finally {
        setCategoriesLoading(false)
      }
    }

    // Prefill from query params (anime / malId)
    const animeTitle = searchParams.get('anime')
    const malId = searchParams.get('malId')

    if (animeTitle) {
      setFormData((prev) => ({
        ...prev,
        title: `مناقشة عن ${animeTitle}`,
        type: 'anime',
      }))
    }

    checkAuth()
    fetchCategories()
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!user) {
      setError('يجب تسجيل الدخول أولاً')
      setSubmitting(false)
      return
    }

    if (!formData.type) {
      setError('يجب اختيار النوع (أنمي/مانجا/مانهوا)')
      setSubmitting(false)
      return
    }

    if (!formData.category) {
      setError('يجب اختيار التصنيف')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          categoryId: formData.category,
          imageUrl: formData.imageUrl || undefined,
          videoUrl: formData.videoUrl || undefined,
          authorId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'فشل إنشاء الموضوع')
        setSubmitting(false)
        return
      }

      setFormData((prev) => ({ ...prev, videoUrl: '' }))

      router.push(`/topic/${data.slug}`)
    } catch (err) {
      setError('حدث خطأ في الاتصال')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">يجب تسجيل الدخول</h2>
          <p className="text-gray-600 mb-6">يجب تسجيل الدخول لإنشاء موضوع جديد</p>
          <Link
            href="/login?redirect=/forum/new"
            className="inline-block bg-anime-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-anime-purple to-anime-pink bg-clip-text text-transparent mb-2">
            موضوع جديد
          </h1>
          <p className="text-gray-600">شاركنا بموضوعك الجديد</p>
          {searchParams.get('anime') && (
            <p className="mt-2 text-sm text-anime-purple">
              تكتب الآن عن الأنمي: <span className="font-semibold">{searchParams.get('anime')}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-md animate-slide-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">العنوان</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple transition input-field"
              placeholder="اكتب عنوان الموضوع..."
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">النوع <span className="text-red-500">*</span></label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple transition bg-white cursor-pointer"
              required
            >
              <option value="">اختر النوع</option>
              {contentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">اختر نوع المحتوى: أنمي، مانجا، أو مانهوا</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">التصنيف <span className="text-red-500">*</span></label>
            {categoriesLoading ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                جاري تحميل التصنيفات...
              </div>
            ) : (
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value })
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple bg-white cursor-pointer"
                required
                disabled={categoriesLoading || categories.length === 0}
              >
                <option value="">اختر التصنيف</option>
                {categories.map((cat: any) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            {categories.length === 0 && !categoriesLoading && (
              <p className="text-sm text-red-500 mt-1">لا توجد تصنيفات متاحة. يرجى التأكد من تشغيل seed script.</p>
            )}
            <p className="text-sm text-gray-500 mt-1">اختر التصنيف المناسب (مثل: نظريات، كوميديا، أكشن، إلخ)</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">المحتوى</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple resize-none transition input-field"
              rows={12}
              placeholder="اكتب محتوى الموضوع هنا..."
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              يمكنك إضافة روابط، صور، أو فيديوهات من مصادر رسمية
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">صورة (اختياري)</label>

            {formData.imageUrl ? (
              <div className="mb-3 overflow-hidden rounded-xl border border-gray-200">
                <img src={formData.imageUrl} alt="preview" className="w-full max-h-80 object-cover" />
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                disabled={submitting || uploadingImage}
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setError('')
                  if (formData.videoUrl) {
                    setError('لا يمكن الجمع بين صورة وفيديو في نفس المنشور')
                    return
                  }
                  setUploadingImage(true)
                  try {
                    const fd = new FormData()
                    fd.set('file', f)
                    const res = await fetch('/api/uploads/image', { method: 'POST', body: fd })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) {
                      setError(data.error || 'فشل رفع الصورة')
                      return
                    }
                    setFormData((prev) => ({ ...prev, imageUrl: String(data?.url || '') }))
                  } catch {
                    setError('فشل رفع الصورة')
                  } finally {
                    setUploadingImage(false)
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white"
              />

              {formData.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                  disabled={submitting || uploadingImage}
                  className="shrink-0 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  إزالة
                </button>
              ) : null}
            </div>

            {uploadingImage ? <p className="mt-2 text-sm text-gray-500">جارٍ رفع الصورة...</p> : null}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">رابط فيديو (اختياري)</label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => {
                const next = e.target.value
                if (formData.imageUrl && next) {
                  setError('لا يمكن الجمع بين صورة وفيديو في نفس المنشور')
                  return
                }
                setFormData({ ...formData, videoUrl: next })
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple transition input-field"
              placeholder="ضع رابط YouTube أو Vimeo"
            />
            <p className="text-sm text-gray-500 mt-2">سيظهر الفيديو داخل المنشور كـ iframe.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-anime-purple to-anime-pink text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {submitting ? 'جاري النشر...' : 'نشر الموضوع'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 font-semibold"
            >
              إلغاء
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewTopicPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <NewTopicPageContent />
    </Suspense>
  )
}

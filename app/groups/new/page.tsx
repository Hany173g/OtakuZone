'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Plus } from 'lucide-react'

export default function NewGroupPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    name: '',
    username: '',
    description: '',
    isPublic: true,
    isApprovalRequired: false,
    category: '',
    tags: '',
  })

  const tagsArray = useMemo(() => {
    return form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }, [form.tags])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/login?redirect=/groups/new')
          return
        }
      } catch {
        router.push('/login?redirect=/groups/new')
        return
      }
    }

    const fetchCategories = async () => {
      setCategoriesLoading(true)
      try {
        const response = await fetch('/api/categories')
        const data = await response.json().catch(() => null)
        if (response.ok && Array.isArray(data)) {
          setCategories(data)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
        setCategoriesLoading(false)
      }
    }

    checkAuth()
    fetchCategories()
  }, [router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!imageFile) {
        setError('صورة المجتمع مطلوبة')
        setSubmitting(false)
        return
      }

      if (!coverFile) {
        setError('صورة الغلاف مطلوبة')
        setSubmitting(false)
        return
      }

      const fd = new FormData()
      fd.set('name', form.name)
      fd.set('username', form.username)
      if (form.description) fd.set('description', form.description)
      fd.set('isPublic', String(form.isPublic))
      fd.set('isApprovalRequired', String(form.isApprovalRequired))
      if (form.category) fd.set('category', form.category)
      fd.set('tags', tagsArray.join(', '))
      fd.set('image', imageFile)
      fd.set('coverImage', coverFile)

      const res = await fetch('/api/groups', {
        method: 'POST',
        body: fd,
      })

      const data = await res.json().catch(() => null)

      if (res.status === 401) {
        router.push('/login?redirect=/groups/new')
        return
      }

      if (!res.ok) {
        setError(data?.error || 'فشل إنشاء المجتمع')
        setSubmitting(false)
        return
      }

      if (data?.slug) {
        router.push(`/groups/${data.slug}`)
      } else {
        router.push('/groups')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
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

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Plus className="w-8 h-8 text-anime-purple" />
            إنشاء مجتمع جديد
          </h1>
          <p className="text-gray-600 mt-2">أنشئ مجتمعًا منظمًا للنقاشات، الأسئلة، والمحتوى المتخصص.</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8">
            <p className="text-gray-800 font-bold">الأساسيات</p>
            <p className="text-gray-600 text-sm mt-1">اختر اسمًا واضحًا، ووصفًا مختصرًا يوضح هدف المجتمع.</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">اسم المجتمع</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple transition"
              placeholder="مثال: عشاق One Piece"
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">المعرّف (مطلوب)</label>
            <p className="text-xs text-gray-500 mb-2">سيظهر في الرابط: /groups/username</p>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple transition"
              placeholder="مثال: onepiece-fans"
              required
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_-]+"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">وصف المجتمع (اختياري)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple transition resize-none"
              rows={4}
              placeholder="اكتب وصفًا موجزًا: ما هدف المجتمع؟ ما نوع المحتوى المتوقع؟"
            />
          </div>

          <div className="my-8 border-t border-gray-200" />

          <div className="mb-8">
            <p className="text-gray-800 font-bold">الهوية البصرية</p>
            <p className="text-gray-600 text-sm mt-1">صورة شعار للمجتمع وصورة غلاف لتوضيح الطابع.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">صورة المجتمع (مطلوبة)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple transition"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">صورة الغلاف (مطلوبة)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple transition"
                required
              />
            </div>
          </div>

          <div className="my-8 border-t border-gray-200" />

          <div className="mb-8">
            <p className="text-gray-800 font-bold">الخصوصية والانضمام</p>
            <p className="text-gray-600 text-sm mt-1">تحكّم في من يمكنه رؤية المجتمع، وطريقة قبول الأعضاء.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">النوع</label>
              <select
                value={form.isPublic ? 'public' : 'private'}
                onChange={(e) => setForm({ ...form, isPublic: e.target.value === 'public' })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple bg-white"
              >
                <option value="public">عام - يمكن للجميع رؤية المجتمع</option>
                <option value="private">خاص - رؤية المجتمع للأعضاء فقط</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">الانضمام</label>
              <select
                value={form.isApprovalRequired ? 'approval' : 'open'}
                onChange={(e) => setForm({ ...form, isApprovalRequired: e.target.value === 'approval' })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple bg-white"
              >
                <option value="open">مفتوح - ينضم العضو مباشرة</option>
                <option value="approval">يتطلب موافقة</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">تصنيف</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple bg-white"
              >
                <option value="">{categoriesLoading ? 'جاري تحميل التصنيفات...' : 'اختر تصنيف'}</option>
                {categories.map((c: any) => (
                  <option key={c.id || c._id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">وسوم (اختياري)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple focus:border-anime-purple transition"
                placeholder="one piece, shonen, spoilers"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-anime-purple to-anime-pink text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? 'جاري الإنشاء...' : 'إنشاء المجتمع'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/groups"
              className="px-8 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2 font-semibold"
            >
              رجوع
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteTopicButtonProps {
  slug: string
  isOwner: boolean
}

export default function DeleteTopicButton({ slug, isOwner }: DeleteTopicButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  if (!isOwner) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/topics/${slug}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/forum')
      } else {
        const data = await response.json()
        alert(data.error || 'فشل حذف الموضوع')
        setShowConfirm(false)
      }
    } catch (error) {
      alert('حدث خطأ أثناء الحذف')
      setShowConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md mx-4">
          <h3 className="text-lg font-bold mb-4">تأكيد الحذف</h3>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            هل أنت متأكد من حذف هذا الموضوع؟ سيتم حذف جميع التعليقات والإعجابات والبيانات المرتبطة به نهائيًا.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
            >
              {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
      title="حذف الموضوع"
    >
      <Trash2 className="w-4 h-4" />
      حذف
    </button>
  )
}

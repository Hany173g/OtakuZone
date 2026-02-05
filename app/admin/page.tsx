import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import User from '@/models/User'
import Topic from '@/models/Topic'
import Comment from '@/models/Comment'
import Category from '@/models/Category'
import { Shield, Users, MessageSquare, Folder, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
  // In a real app, you'd check authentication and role here
  // For now, we'll just show the admin panel

  const stats = await withDB(async () => {
    const [users, topics, comments, categories] = await Promise.all([
      User.countDocuments(),
      Topic.countDocuments(),
      Comment.countDocuments(),
      Category.countDocuments(),
    ])

    return { users, topics, comments, categories }
  })

  const recentTopics = await withDB(async () => {
    const topics = await Topic.find()
      .populate('authorId', 'name')
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    return topics.map((topic: any) => ({
      id: topic._id.toString(),
      slug: topic.slug,
      title: topic.title,
      author: { name: topic.authorId?.name || 'مجهول' },
      category: topic.categoryId,
      createdAt: topic.createdAt,
    }))
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-anime-purple" />
        <h1 className="text-4xl font-bold text-gray-800">لوحة الإدارة</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">المستخدمين</p>
              <p className="text-3xl font-bold text-gray-800">{stats.users}</p>
            </div>
            <Users className="w-12 h-12 text-anime-blue" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">المواضيع</p>
              <p className="text-3xl font-bold text-gray-800">{stats.topics}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-anime-pink" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">التعليقات</p>
              <p className="text-3xl font-bold text-gray-800">{stats.comments}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-anime-purple" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">التصنيفات</p>
              <p className="text-3xl font-bold text-gray-800">{stats.categories}</p>
            </div>
            <Folder className="w-12 h-12 text-anime-orange" />
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/admin/categories"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
        >
          <Folder className="w-8 h-8 text-anime-orange mb-4" />
          <h3 className="text-xl font-semibold mb-2">إدارة التصنيفات</h3>
          <p className="text-gray-600">إضافة، تعديل، أو حذف التصنيفات</p>
        </Link>

        <Link
          href="/admin/topics"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
        >
          <MessageSquare className="w-8 h-8 text-anime-pink mb-4" />
          <h3 className="text-xl font-semibold mb-2">إدارة المواضيع</h3>
          <p className="text-gray-600">تثبيت، إغلاق، أو حذف المواضيع</p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
        >
          <Users className="w-8 h-8 text-anime-blue mb-4" />
          <h3 className="text-xl font-semibold mb-2">إدارة المستخدمين</h3>
          <p className="text-gray-600">تعديل الصلاحيات أو حظر المستخدمين</p>
        </Link>

        <Link
          href="/admin/reports"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
        >
          <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">التقارير</h3>
          <p className="text-gray-600">عرض ومعالجة التقارير</p>
        </Link>

        <Link
          href="/admin/ads"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition"
        >
          <Folder className="w-8 h-8 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">إدارة الإعلانات</h3>
          <p className="text-gray-600">إدارة الإعلانات والإيرادات</p>
        </Link>
      </div>

      {/* Recent Topics */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">آخر المواضيع</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right p-3">العنوان</th>
                <th className="text-right p-3">الكاتب</th>
                <th className="text-right p-3">التصنيف</th>
                <th className="text-right p-3">التاريخ</th>
                <th className="text-right p-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {recentTopics.map((topic) => (
                <tr key={topic.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <Link
                      href={`/topic/${topic.slug}`}
                      className="text-anime-purple hover:text-anime-pink"
                    >
                      {topic.title}
                    </Link>
                  </td>
                  <td className="p-3">{topic.author.name || 'مجهول'}</td>
                  <td className="p-3">{topic.category?.name || 'غير محدد'}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(topic.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="text-anime-blue hover:text-blue-700 text-sm">
                        تثبيت
                      </button>
                      <button className="text-red-500 hover:text-red-700 text-sm">
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


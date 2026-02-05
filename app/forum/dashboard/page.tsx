import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Topic from '@/models/Topic'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import User from '@/models/User'
import Category from '@/models/Category'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BarChart3, MessageSquare, Eye, Heart, Users, TrendingUp, Calendar, FileText } from 'lucide-react'

export default async function ForumDashboardPage() {
  const session = await getSession()
  
  // Only admins can access
  if (!session?.id || session.role !== 'admin') {
    redirect('/forum')
  }

  const stats = await withDB(async () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Total stats
    const [
      totalTopics,
      totalComments,
      totalLikes,
      totalUsers,
      totalCategories,
      topicsThisMonth,
      commentsThisMonth,
      likesThisMonth,
      topicsThisWeek,
      commentsThisWeek,
      likesThisWeek,
    ] = await Promise.all([
      Topic.countDocuments(),
      Comment.countDocuments(),
      Like.countDocuments(),
      User.countDocuments(),
      Category.countDocuments(),
      Topic.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Comment.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Like.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Topic.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Comment.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Like.countDocuments({ createdAt: { $gte: startOfWeek } }),
    ])

    // Top topics
    const topTopics = await Topic.find()
      .populate('authorId', 'name')
      .populate('categoryId', 'name')
      .sort({ views: -1 })
      .limit(10)
      .lean()

    const topTopicsWithCounts = await Promise.all(
      topTopics.map(async (topic: any) => {
        const [commentCount, likeCount] = await Promise.all([
          Comment.countDocuments({ topicId: topic._id }),
          Like.countDocuments({ topicId: topic._id }),
        ])
        return {
          ...topic,
          id: topic._id.toString(),
          _count: {
            comments: commentCount,
            likes: likeCount,
          },
        }
      })
    )

    // Most active users
    const allUsers = await User.find().lean()
    const usersWithActivity = await Promise.all(
      allUsers.map(async (u: any) => {
        const [topics, comments, likesReceived] = await Promise.all([
          Topic.countDocuments({ authorId: u._id }),
          Comment.countDocuments({ authorId: u._id }),
          Promise.all([
            Topic.find({ authorId: u._id }).select('_id').lean().then(async (topics) => {
              const topicIds = topics.map((t: any) => t._id)
              if (topicIds.length === 0) return 0
              return Like.countDocuments({ topicId: { $in: topicIds } })
            }),
            Comment.find({ authorId: u._id }).select('_id').lean().then(async (comments) => {
              const commentIds = comments.map((c: any) => c._id)
              if (commentIds.length === 0) return 0
              return Like.countDocuments({ commentId: { $in: commentIds } })
            }),
          ]).then(([topicLikes, commentLikes]) => topicLikes + commentLikes),
        ])
        return {
          ...u,
          id: u._id.toString(),
          activity: {
            topics,
            comments,
            likesReceived,
            total: topics * 10 + comments * 2 + likesReceived,
          },
        }
      })
    )

    const topUsers = usersWithActivity
      .sort((a, b) => b.activity.total - a.activity.total)
      .slice(0, 10)

    return {
      total: {
        topics: totalTopics,
        comments: totalComments,
        likes: totalLikes,
        users: totalUsers,
        categories: totalCategories,
      },
      monthly: {
        topics: topicsThisMonth,
        comments: commentsThisMonth,
        likes: likesThisMonth,
      },
      weekly: {
        topics: topicsThisWeek,
        comments: commentsThisWeek,
        likes: likesThisWeek,
      },
      topTopics: topTopicsWithCounts,
      topUsers,
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-anime-purple" />
          Dashboard المنتدى
        </h1>
        <p className="text-gray-600">إحصائيات شاملة عن المنتدى</p>
      </div>

      {/* Total Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-anime-purple to-anime-pink rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.total.topics}</span>
          </div>
          <p className="text-sm opacity-90">إجمالي المواضيع</p>
        </div>

        <div className="bg-gradient-to-br from-anime-blue to-anime-purple rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.total.comments}</span>
          </div>
          <p className="text-sm opacity-90">إجمالي التعليقات</p>
        </div>

        <div className="bg-gradient-to-br from-anime-orange to-anime-pink rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.total.likes}</span>
          </div>
          <p className="text-sm opacity-90">إجمالي الإعجابات</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.total.users}</span>
          </div>
          <p className="text-sm opacity-90">إجمالي المستخدمين</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.total.categories}</span>
          </div>
          <p className="text-sm opacity-90">التصنيفات</p>
        </div>
      </div>

      {/* Monthly & Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-anime-purple" />
            <h2 className="text-2xl font-bold text-gray-800">هذا الشهر</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">مواضيع</span>
              <span className="font-bold text-lg">{stats.monthly.topics}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">تعليقات</span>
              <span className="font-bold text-lg">{stats.monthly.comments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">إعجابات</span>
              <span className="font-bold text-lg">{stats.monthly.likes}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-anime-blue" />
            <h2 className="text-2xl font-bold text-gray-800">هذا الأسبوع</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">مواضيع</span>
              <span className="font-bold text-lg">{stats.weekly.topics}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">تعليقات</span>
              <span className="font-bold text-lg">{stats.weekly.comments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">إعجابات</span>
              <span className="font-bold text-lg">{stats.weekly.likes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Topics & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-anime-purple" />
            <h2 className="text-2xl font-bold text-gray-800">أكثر المواضيع مشاهدة</h2>
          </div>
          <div className="space-y-3">
            {stats.topTopics.map((topic: any, index: number) => (
              <div key={topic.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-anime-purple font-bold">#{index + 1}</span>
                    <span className="font-semibold text-gray-800">{topic.title}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {topic.categoryId?.name || 'بدون تصنيف'} • {topic.authorId?.name || 'مجهول'}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {topic.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {topic._count.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {topic._count.likes}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-anime-blue" />
            <h2 className="text-2xl font-bold text-gray-800">أكثر المستخدمين نشاطاً</h2>
          </div>
          <div className="space-y-3">
            {stats.topUsers.map((user: any, index: number) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-anime-purple font-bold">#{index + 1}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{user.name || 'مستخدم'}</div>
                    <div className="text-sm text-gray-600">
                      {user.activity.topics} مواضيع • {user.activity.comments} تعليقات • {user.activity.likesReceived} إعجاب
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-anime-purple">{user.activity.total}</div>
                  <div className="text-xs text-gray-500">نقطة</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


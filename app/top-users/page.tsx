import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import User from '@/models/User'
import Topic from '@/models/Topic'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import Rating from '@/models/Rating'
import Link from 'next/link'
import { Trophy, Medal, Award, User as UserIcon, MessageSquare, Heart, Star, TrendingUp } from 'lucide-react'

interface TopUser {
  id: string
  name?: string
  // Email removed - secure data
  image?: string
  role: string
  createdAt: Date
  rank: number
  stats: {
    topics: number
    comments: number
    likesReceived: number
    ratings: number
    activityScore: number
  }
}

export default async function TopUsersPage() {
  const topUsers = await withDB(async () => {
    const users = await User.find({})
      .select('name image role createdAt')
      .lean()

    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const userId = user._id

        const [topicsCount, commentsCount, likesReceived, ratingsCount] = await Promise.all([
          Topic.countDocuments({ authorId: userId }),
          Comment.countDocuments({ authorId: userId }),
          Promise.all([
            Topic.find({ authorId: userId }).select('_id').lean().then(async (topics) => {
              const topicIds = topics.map((t: any) => t._id)
              if (topicIds.length === 0) return 0
              return Like.countDocuments({ topicId: { $in: topicIds } })
            }),
            Comment.find({ authorId: userId }).select('_id').lean().then(async (comments) => {
              const commentIds = comments.map((c: any) => c._id)
              if (commentIds.length === 0) return 0
              return Like.countDocuments({ commentId: { $in: commentIds } })
            }),
          ]).then(([topicLikes, commentLikes]) => topicLikes + commentLikes),
          Rating.countDocuments({ userId }),
        ])

        const activityScore = 
          (topicsCount * 10) + 
          (commentsCount * 2) + 
          (likesReceived * 1) + 
          (ratingsCount * 5)

        return {
          ...user,
          id: user._id.toString(),
          stats: {
            topics: topicsCount,
            comments: commentsCount,
            likesReceived,
            ratings: ratingsCount,
            activityScore,
          },
        }
      })
    )

    return usersWithStats
      .filter((user) => user.stats.activityScore > 0)
      .sort((a, b) => b.stats.activityScore - a.stats.activityScore)
      .slice(0, 100)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }))
  })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />
    return <span className="text-gray-500 font-bold">#{rank}</span>
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600'
    return 'bg-gray-200'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-anime-purple to-anime-pink bg-clip-text text-transparent">
            أفضل المستخدمين
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          المستخدمون الأكثر نشاطاً في المجتمع بناءً على المواضيع، التعليقات، الإعجابات، والتقييمات
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-r-4 border-anime-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">إجمالي المستخدمين</p>
              <p className="text-3xl font-bold text-gray-800">{topUsers.length}</p>
            </div>
            <UserIcon className="w-12 h-12 text-anime-purple" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-r-4 border-anime-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">إجمالي المواضيع</p>
              <p className="text-3xl font-bold text-gray-800">
                {topUsers.reduce((sum, user) => sum + user.stats.topics, 0)}
              </p>
            </div>
            <MessageSquare className="w-12 h-12 text-anime-pink" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-r-4 border-anime-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">إجمالي التعليقات</p>
              <p className="text-3xl font-bold text-gray-800">
                {topUsers.reduce((sum, user) => sum + user.stats.comments, 0)}
              </p>
            </div>
            <MessageSquare className="w-12 h-12 text-anime-blue" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-r-4 border-anime-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">إجمالي الإعجابات</p>
              <p className="text-3xl font-bold text-gray-800">
                {topUsers.reduce((sum, user) => sum + user.stats.likesReceived, 0)}
              </p>
            </div>
            <Heart className="w-12 h-12 text-anime-orange" />
          </div>
        </div>
      </div>

      {/* Top Users List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-anime-purple to-anime-pink text-white">
              <tr>
                <th className="text-right p-4 font-semibold">الترتيب</th>
                <th className="text-right p-4 font-semibold">المستخدم</th>
                <th className="text-right p-4 font-semibold">المواضيع</th>
                <th className="text-right p-4 font-semibold">التعليقات</th>
                <th className="text-right p-4 font-semibold">الإعجابات</th>
                <th className="text-right p-4 font-semibold">التقييمات</th>
                <th className="text-right p-4 font-semibold">نقاط النشاط</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((user: TopUser) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center justify-center">
                      {getRankIcon(user.rank)}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-3 hover:text-anime-purple transition"
                    >
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || 'User'}
                          className="w-12 h-12 rounded-full border-2 border-anime-purple"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-anime-purple flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user.name || 'مستخدم'}
                        </p>
                        {/* Email removed - secure data */}
                        {user.role === 'admin' && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Admin</span>
                        )}
                        {user.role === 'moderator' && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Moderator</span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-anime-pink">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-semibold">{user.stats.topics}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-anime-blue">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-semibold">{user.stats.comments}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-anime-orange">
                      <Heart className="w-4 h-4" />
                      <span className="font-semibold">{user.stats.likesReceived}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4" />
                      <span className="font-semibold">{user.stats.ratings}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-5 h-5 text-anime-purple" />
                      <span className="font-bold text-lg text-anime-purple">
                        {user.stats.activityScore.toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topUsers.length === 0 && (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا يوجد مستخدمين نشطين بعد</p>
            <p className="text-gray-400 mt-2">ابدأ بإنشاء مواضيع وتعليقات لتصبح في القائمة!</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-gradient-to-r from-anime-purple/10 to-anime-pink/10 rounded-xl p-6 border border-anime-purple/20">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-anime-purple" />
          كيف يتم حساب نقاط النشاط؟
        </h3>
        <ul className="text-gray-600 space-y-1 text-sm">
          <li>• كل موضوع منشور = <strong>10 نقاط</strong></li>
          <li>• كل تعليق = <strong>2 نقطة</strong></li>
          <li>• كل إعجاب مستلم = <strong>1 نقطة</strong></li>
          <li>• كل تقييم = <strong>5 نقاط</strong></li>
        </ul>
      </div>
    </div>
  )
}


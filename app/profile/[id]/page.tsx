import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import User from '@/models/User'
import Topic from '@/models/Topic'
import Category from '@/models/Category'
import Comment from '@/models/Comment'
import UserFollow from '@/models/UserFollow'
import Like from '@/models/Like'
import mongoose from 'mongoose'
import { notFound } from 'next/navigation'
import { User as UserIcon, MessageSquare, Eye, Calendar, Users, UserPlus, Heart, Settings, Lock } from 'lucide-react'
import TopicCard from '@/components/TopicCard'
import FollowUserButton from '@/components/FollowUserButton'
import MessageUserButton from '@/components/MessageUserButton'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { SocialLinksBar } from '@/components/SocialLinks'

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getSession()
  const currentUserId = session?.id // getSession returns UserSession directly, not { user: UserSession }

  const user = await withDB(async () => {
    const foundUser = await User.findById(params.id).lean()
    
    if (!foundUser) {
      return null
    }

    // Compare IDs properly - both as strings
    const foundUserId = foundUser._id.toString()
    const isOwnProfile = Boolean(currentUserId && String(currentUserId) === String(foundUserId))
    const profileVisibility = foundUser.profileVisibility || 'public'

    // Check if current user can view this profile
    let canViewProfile = true
    let isMutualFollow = false

    if (!isOwnProfile && profileVisibility !== 'public') {
      if (currentUserId) {
        const currentUserIdObj = new mongoose.Types.ObjectId(currentUserId)
        // Check if mutual follow (friends)
        const [userFollowsCurrent, currentFollowsUser] = await Promise.all([
          UserFollow.findOne({
            followerId: foundUser._id,
            followingId: currentUserIdObj,
          }).lean(),
          UserFollow.findOne({
            followerId: currentUserIdObj,
            followingId: foundUser._id,
          }).lean(),
        ])

        isMutualFollow = !!userFollowsCurrent && !!currentFollowsUser

        if (profileVisibility === 'private') {
          // Private: only followers can see
          canViewProfile = !!currentFollowsUser
        } else if (profileVisibility === 'friends') {
          // Friends: only mutual follows can see
          canViewProfile = isMutualFollow
        }
      } else {
        // Not logged in and profile is not public
        canViewProfile = false
      }
    }

    // Get topics and comments only if can view
    let topics: any[] = []
    let comments: any[] = []

    if (canViewProfile || isOwnProfile) {
      topics = await Topic.find({ authorId: foundUser._id })
        .populate('categoryId')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()

      comments = await Comment.find({ authorId: foundUser._id })
        .populate('topicId', 'title slug')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    }

    // Get all stats in parallel
    const [
      topicsCount,
      commentsCount,
      followersCount,
      followingCount,
      likesReceived,
      isFollowing,
    ] = await Promise.all([
      Topic.countDocuments({ authorId: foundUser._id }),
      Comment.countDocuments({ authorId: foundUser._id }),
      // عدد المتابعين (من يتابع هذا المستخدم)
      UserFollow.countDocuments({ followingId: foundUser._id }),
      // عدد المتابعين (من يتابعهم هذا المستخدم)
      UserFollow.countDocuments({ followerId: foundUser._id }),
      // الإعجابات المستلمة على مواضيع وتعليقات المستخدم
      Promise.all([
        Topic.find({ authorId: foundUser._id }).select('_id').lean().then(async (topics) => {
          const topicIds = topics.map((t: any) => t._id)
          if (topicIds.length === 0) return 0
          return Like.countDocuments({ topicId: { $in: topicIds } })
        }),
        Comment.find({ authorId: foundUser._id }).select('_id').lean().then(async (comments) => {
          const commentIds = comments.map((c: any) => c._id)
          if (commentIds.length === 0) return 0
          return Like.countDocuments({ commentId: { $in: commentIds } })
        }),
      ]).then(([topicLikes, commentLikes]) => topicLikes + commentLikes),
      // هل المستخدم الحالي يتابع هذا المستخدم؟
      currentUserId
        ? UserFollow.findOne({
            followerId: currentUserId,
            followingId: foundUser._id,
          }).lean()
        : null,
    ])

    const topicsWithCounts = await Promise.all(
      topics.map(async (topic: any) => {
        const [commentCount, likeCount] = await Promise.all([
          Comment.countDocuments({ topicId: topic._id }),
          (await import('@/models/Like')).default.countDocuments({ topicId: topic._id }),
        ])
        return {
          ...topic,
          id: topic._id.toString(),
          author: {
            id: foundUser._id.toString(),
            name: foundUser.name,
            image: foundUser.image,
          },
          category: topic.categoryId,
          _count: {
            comments: commentCount,
            likes: likeCount,
          },
        }
      })
    )

    return {
      ...foundUser,
      id: foundUser._id.toString(),
      topics: topicsWithCounts,
      comments,
      _count: {
        topics: topicsCount,
        comments: commentsCount,
        followers: followersCount,
        following: followingCount,
        likesReceived,
      },
      isFollowing: !!isFollowing,
      isOwnProfile,
      canViewProfile,
      isMutualFollow,
      profileVisibility,
    }
  })

  if (!user) {
    notFound()
  }

  const contentVisible = Boolean(user.canViewProfile || user.isOwnProfile)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <div className="flex items-start gap-6">
          <div className="relative">
            <img
              src={user.image || '/default-avatar.svg'}
              alt={user.name || 'User'}
              className="w-24 h-24 rounded-full border-4 border-anime-purple"
            />
            {user.role === 'admin' && (
              <span className="absolute bottom-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Admin
              </span>
            )}
            {user.role === 'moderator' && (
              <span className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Moderator
              </span>
            )}
            {/* Settings Icon for Own Profile */}
            {user.isOwnProfile && (
              <Link
                href="/settings"
                className="absolute top-0 left-0 bg-anime-purple text-white p-2 rounded-full hover:bg-purple-700 transition shadow-lg"
                title="الإعدادات"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-800">
                {user.name || 'مستخدم'}
              </h1>
              {user.profileVisibility === 'private' && (
                <span className="flex items-center gap-1 text-gray-500 text-sm">
                  <Lock className="w-4 h-4" />
                  خاص
                </span>
              )}
              {user.profileVisibility === 'friends' && (
                <span className="flex items-center gap-1 text-gray-500 text-sm">
                  <Users className="w-4 h-4" />
                  أصدقاء فقط
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">روابط المنصات</div>
              {Object.values(((user as any).socialLinks || {}) as any).some(Boolean) ? (
                <SocialLinksBar links={(user as any).socialLinks || {}} userId={user.id} />
              ) : (
                <div className="text-sm text-gray-500">لا توجد روابط بعد.</div>
              )}
            </div>
            {/* Email is NEVER shown - removed completely */}

            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-anime-purple" />
                <span className="font-semibold">{user._count.topics}</span>
                <span>مواضيع</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-anime-blue" />
                <span className="font-semibold">{user._count.comments}</span>
                <span>تعليقات</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-anime-pink" />
                <span className="font-semibold">{user._count.followers}</span>
                <span>متابعين</span>
              </div>
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-anime-orange" />
                <span className="font-semibold">{user._count.following}</span>
                <span>متابع</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-semibold">{user._count.likesReceived}</span>
                <span>إعجاب</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span>انضم {new Date(user.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>

            {/* Follow Button - Only show if not own profile */}
            {!user.isOwnProfile && session && (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <FollowUserButton userId={user.id} initialFollowing={user.isFollowing} />
                  <MessageUserButton userId={user.id} />
                </div>
              </div>
            )}

            {!user.isOwnProfile && !session && !contentVisible && (
              <div className="mt-4">
                <Link
                  href="/login"
                  className="inline-block bg-anime-purple text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  تسجيل الدخول
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {!contentVisible && !user.isOwnProfile && (
        <div className="bg-white rounded-xl shadow-md p-10 text-center mb-6">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">هذا الحساب خاص</h2>
          <p className="text-gray-600">
            {user.profileVisibility === 'private'
              ? 'يمكنك رؤية حالة الحساب، لكن يجب متابعة هذا المستخدم لرؤية المواضيع والتعليقات.'
              : 'يمكنك رؤية حالة الحساب، لكن يجب أن تكون صديقاً لهذا المستخدم لرؤية المواضيع والتعليقات.'}
          </p>
        </div>
      )}

      {/* User Topics */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">المواضيع المنشورة</h2>
        {!contentVisible ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">المواضيع مخفية حسب إعدادات الخصوصية</p>
          </div>
        ) : user.topics.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">لا توجد مواضيع منشورة بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.topics.map((topic: any) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </div>

      {/* User Comments */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">التعليقات الأخيرة</h2>
        {!contentVisible ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">التعليقات مخفية حسب إعدادات الخصوصية</p>
          </div>
        ) : user.comments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">لا توجد تعليقات بعد</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="space-y-4">
              {user.comments.map((comment: any) => (
                <div key={comment._id.toString()} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/topic/${comment.topicId?.slug || '#'}`}
                      className="text-anime-purple hover:text-anime-pink font-semibold"
                    >
                      {comment.topicId?.title || 'موضوع محذوف'}
                    </Link>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <div
                    className="prose prose-sm text-gray-700 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { withDB } from '@/lib/db'
import '@/models'
import Favorite from '@/models/Favorite'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TopicCard from '@/components/TopicCard'
import mongoose from 'mongoose'

export default async function FavoritesPage() {
  const session = await getSession()
  if (!session?.id) {
    redirect('/login?redirect=/favorites')
  }

  const topics = await withDB(async () => {
    const favorites = await Favorite.find({ userId: new mongoose.Types.ObjectId(session.id) })
      .populate({
        path: 'topicId',
        populate: [
          { path: 'authorId', select: 'name image' },
          { path: 'categoryId' },
        ],
      })
      .sort({ createdAt: -1 })
      .lean()

    const topicsWithCounts = await Promise.all(
      favorites.map(async (fav: any) => {
        if (!fav.topicId) return null
        const topic = fav.topicId
        const [commentCount, likeCount] = await Promise.all([
          Comment.countDocuments({ topicId: topic._id }),
          Like.countDocuments({ topicId: topic._id }),
        ])

        return {
          ...topic,
          id: topic._id.toString(),
          author: topic.authorId,
          category: topic.categoryId,
          _count: {
            comments: commentCount,
            likes: likeCount,
          },
        }
      })
    )

    return topicsWithCounts.filter((t) => t !== null)
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">المفضلة</h1>
        <p className="text-gray-600">المواضيع التي أضفتها للمفضلة</p>
      </div>

      {topics.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">لا توجد مواضيع في المفضلة حالياً</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map((topic: any) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  )
}

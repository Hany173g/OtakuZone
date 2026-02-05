import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Favorite from '@/models/Favorite'
import Topic from '@/models/Topic'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'
import { emitToUser } from '@/lib/realtime'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')

    if (topicId) {
      const favorited = await withDB(async () => {
        const existing = await Favorite.findOne({
          userId: new mongoose.Types.ObjectId(session.id),
          topicId: new mongoose.Types.ObjectId(topicId),
        })
          .select('_id')
          .lean()
        return !!existing
      })

      return NextResponse.json({ favorited })
    }

    const topics = await withDB(async () => {
      const favorites = await Favorite.find({
        userId: new mongoose.Types.ObjectId(session.id),
      })
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

    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { topicId } = body

    if (!topicId) {
      return NextResponse.json(
        { error: 'معرف الموضوع مطلوب' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const actorId = new mongoose.Types.ObjectId(session.id)
      const topicIdObj = new mongoose.Types.ObjectId(topicId)
      const existing = await Favorite.findOne({
        userId: actorId,
        topicId: topicIdObj,
      }).lean()

      if (existing) {
        await Favorite.deleteOne({ _id: existing._id })
        return { favorited: false, message: 'تمت إزالة الموضوع من المفضلة' }
      } else {
        await Favorite.create({
          userId: actorId,
          topicId: topicIdObj,
        })

        try {
          const [topic, actor] = await Promise.all([
            Topic.findById(topicIdObj).select('title slug authorId').lean(),
            User.findById(actorId).select('name').lean(),
          ])

          if (topic && topic.authorId?.toString() !== actorId.toString()) {
            const n = await Notification.create({
              userId: topic.authorId,
              type: 'favorite',
              message: `أضاف ${actor?.name || 'مستخدم'} منشورك "${topic.title}" إلى المفضلة`,
              link: `/topic/${topic.slug}`,
              relatedUserId: actorId,
              relatedTopicId: topicIdObj,
            })

            emitToUser(topic.authorId.toString(), 'notification:new', {
              id: n._id.toString(),
              type: n.type,
              message: n.message,
              read: n.read,
              link: n.link,
              createdAt: n.createdAt,
            })
          }
        } catch {
          // ignore
        }
        return { favorited: true, message: 'تمت إضافة الموضوع للمفضلة' }
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error toggling favorite:', error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'هذا الموضوع موجود بالفعل في المفضلة' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}


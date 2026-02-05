import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Topic from '@/models/Topic'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const activity = await withDB(async () => {
      const userId = new mongoose.Types.ObjectId(session.id)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Topics created this month
      const topics = await Topic.countDocuments({
        authorId: userId,
        createdAt: { $gte: startOfMonth },
      })

      // Comments created this month
      const comments = await Comment.countDocuments({
        authorId: userId,
        createdAt: { $gte: startOfMonth },
      })

      // Likes received this month
      const userTopics = await Topic.find({ authorId: userId }).select('_id').lean()
      const userComments = await Comment.find({ authorId: userId }).select('_id').lean()
      
      const topicIds = userTopics.map((t: any) => t._id)
      const commentIds = userComments.map((c: any) => c._id)

      const [topicLikes, commentLikes] = await Promise.all([
        topicIds.length > 0
          ? Like.countDocuments({
              topicId: { $in: topicIds },
              createdAt: { $gte: startOfMonth },
            })
          : 0,
        commentIds.length > 0
          ? Like.countDocuments({
              commentId: { $in: commentIds },
              createdAt: { $gte: startOfMonth },
            })
          : 0,
      ])

      return {
        topics,
        comments,
        likesReceived: topicLikes + commentLikes,
        month: now.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }),
      }
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error fetching monthly activity:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}


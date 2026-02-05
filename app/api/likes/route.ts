import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withDB } from '@/lib/db'
import '@/models'
import Like from '@/models/Like'
import Dislike from '@/models/Dislike'
import Notification from '@/models/Notification'
import Topic from '@/models/Topic'
import Comment from '@/models/Comment'
import User from '@/models/User'
import mongoose from 'mongoose'
import { translateZodError, ERROR_MESSAGES } from '@/lib/validation-ar'
import { getSession } from '@/lib/auth'
import { emitToUser } from '@/lib/realtime'

const reactionSchema = z.object({
  userId: z.string().min(1, 'معرف المستخدم مطلوب'),
  topicId: z.string().optional(),
  commentId: z.string().optional(),
  groupTopicId: z.string().optional(),
  groupCommentId: z.string().optional(),
  value: z.enum(['like', 'dislike'], { errorMap: () => ({ message: 'القيمة يجب أن تكون: إعجاب أو عدم إعجاب' }) }),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ state: 'none' })
    }

    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')
    const commentId = searchParams.get('commentId')
    const groupTopicId = searchParams.get('groupTopicId')
    const groupCommentId = searchParams.get('groupCommentId')

    if (!topicId && !commentId && !groupTopicId && !groupCommentId) {
      return NextResponse.json({ error: 'معرف الموضوع أو التعليق مطلوب' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const userId = new mongoose.Types.ObjectId(session.id)
      const tid = topicId ? new mongoose.Types.ObjectId(topicId) : undefined
      const cid = commentId ? new mongoose.Types.ObjectId(commentId) : undefined
      const gtid = groupTopicId ? new mongoose.Types.ObjectId(groupTopicId) : undefined
      const gcid = groupCommentId ? new mongoose.Types.ObjectId(groupCommentId) : undefined
      const query: any = { userId, topicId: tid, commentId: cid, groupTopicId: gtid, groupCommentId: gcid }

      const [liked, disliked] = await Promise.all([
        Like.findOne(query).select('_id').lean(),
        Dislike.findOne(query).select('_id').lean(),
      ])

      if (liked) return { state: 'like' as const }
      if (disliked) return { state: 'dislike' as const }
      return { state: 'none' as const }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching reaction state:', error)
    return NextResponse.json({ state: 'none' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json()
    const validated = reactionSchema.parse(body)

    if (String(validated.userId) !== String(session.id)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    if (!validated.topicId && !validated.commentId && !validated.groupTopicId && !validated.groupCommentId) {
      return NextResponse.json({ error: 'معرف الموضوع أو التعليق مطلوب' }, { status: 400 })
    }

    const targets = [validated.topicId, validated.commentId, validated.groupTopicId, validated.groupCommentId].filter(Boolean)
    if (targets.length !== 1) {
      return NextResponse.json({ error: 'يجب تحديد هدف واحد فقط للتفاعل' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const userId = new mongoose.Types.ObjectId(validated.userId)
      const topicId = validated.topicId ? new mongoose.Types.ObjectId(validated.topicId) : undefined
      const commentId = validated.commentId ? new mongoose.Types.ObjectId(validated.commentId) : undefined
      const groupTopicId = validated.groupTopicId ? new mongoose.Types.ObjectId(validated.groupTopicId) : undefined
      const groupCommentId = validated.groupCommentId ? new mongoose.Types.ObjectId(validated.groupCommentId) : undefined
      const query: any = { userId, topicId, commentId, groupTopicId, groupCommentId }

      if (validated.value === 'like') {
        const existing = await Like.findOne(query).lean()
        if (existing) {
          await Like.deleteOne({ _id: existing._id })
          return { like: false, dislike: false }
        }
        // remove opposite
        await Dislike.deleteOne(query)
        await Like.create(query)

        // Send notification - only for topics, NOT for comments
        if (validated.topicId && !validated.commentId) {
          const topic = await Topic.findById(validated.topicId).lean()
          const liker = await User.findById(userId).lean()
          
          if (topic && topic.authorId.toString() !== userId.toString()) {
            const n = await Notification.create({
              userId: topic.authorId,
              type: 'like',
              message: `أعجب ${liker?.name || 'مستخدم'} بمنشورك "${topic.title}"`,
              link: `/topic/${topic.slug}`,
              relatedUserId: userId,
              relatedTopicId: topic._id,
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
        }
        // No notification for comment likes (as per requirement)

        return { like: true, dislike: false }
      } else {
        const existing = await Dislike.findOne(query).lean()
        if (existing) {
          await Dislike.deleteOne({ _id: existing._id })
          return { like: false, dislike: false }
        }
        await Like.deleteOne(query)
        await Dislike.create(query)
        return { like: false, dislike: true }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: translateZodError(error) },
        { status: 400 }
      )
    }
    console.error('Error toggling reaction:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNKNOWN_ERROR },
      { status: 500 }
    )
  }
}


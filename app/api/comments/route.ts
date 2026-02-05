import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Comment from '@/models/Comment'
import Notification from '@/models/Notification'
import Topic from '@/models/Topic'
import User from '@/models/User'
import { z } from 'zod'
import mongoose from 'mongoose'
import { translateZodError, ERROR_MESSAGES } from '@/lib/validation-ar'
import { bbcodeToHtml } from '@/lib/bbcode'
import { emitToUser } from '@/lib/realtime'

const commentSchema = z.object({
  content: z.string().min(1, 'محتوى التعليق مطلوب'),
  topicId: z.string().min(1, 'معرف الموضوع مطلوب'),
  authorId: z.string().min(1, 'معرف المؤلف مطلوب'),
  parentId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = commentSchema.parse(body)

    const comment = await withDB(async () => {
      const newComment = await Comment.create({
        content: bbcodeToHtml(validatedData.content),
        topicId: new mongoose.Types.ObjectId(validatedData.topicId),
        authorId: new mongoose.Types.ObjectId(validatedData.authorId),
        parentId: validatedData.parentId ? new mongoose.Types.ObjectId(validatedData.parentId) : null,
      })

      // Send notification to topic author (only if not the same person and not a reply)
      if (!validatedData.parentId) {
        const topic = await Topic.findById(validatedData.topicId).lean()
        const commenter = await User.findById(validatedData.authorId).lean()
        
        if (topic && topic.authorId.toString() !== validatedData.authorId) {
          const n = await Notification.create({
            userId: topic.authorId,
            type: 'comment',
            message: `علق ${commenter?.name || 'مستخدم'} على منشورك "${topic.title}"`,
            link: `/topic/${topic.slug}`,
            relatedUserId: new mongoose.Types.ObjectId(validatedData.authorId),
            relatedTopicId: topic._id,
            relatedCommentId: newComment._id,
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
      } else {
        // Reply to comment - notify parent comment author
        const parentComment = await Comment.findById(validatedData.parentId).lean()
        const replier = await User.findById(validatedData.authorId).lean()
        const topic = await Topic.findById(validatedData.topicId).lean()
        
        if (parentComment && parentComment.authorId.toString() !== validatedData.authorId) {
          const n2 = await Notification.create({
            userId: parentComment.authorId,
            type: 'comment_reply',
            message: `رد ${replier?.name || 'مستخدم'} على تعليقك`,
            link: `/topic/${topic?.slug || ''}`,
            relatedUserId: new mongoose.Types.ObjectId(validatedData.authorId),
            relatedTopicId: topic?._id,
            relatedCommentId: newComment._id,
          })

          emitToUser(parentComment.authorId.toString(), 'notification:new', {
            id: n2._id.toString(),
            type: n2.type,
            message: n2.message,
            read: n2.read,
            link: n2.link,
            createdAt: n2.createdAt,
          })
        }
      }

      return await Comment.findById(newComment._id)
        .populate('authorId', 'name image id')
        .lean()
    })

    if (!comment) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CREATE_FAILED },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...comment,
      id: comment._id.toString(),
      author: comment.authorId,
      replies: [],
      _count: {
        likes: 0,
        replies: 0,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: translateZodError(error) },
        { status: 400 }
      )
    }
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.CREATE_FAILED },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId is required' },
        { status: 400 }
      )
    }

    const comments = await withDB(async () => {
      const Like = (await import('@/models/Like')).default
      const mainComments = await Comment.find({
        topicId: new mongoose.Types.ObjectId(topicId),
        parentId: null,
      })
        .populate('authorId', 'name image id')
        .sort({ createdAt: 1 })
        .lean()

      const enriched = await Promise.all(
        mainComments.map(async (comment: any) => {
          const [likeCount, replyCount] = await Promise.all([
            Like.countDocuments({ commentId: comment._id }),
            Comment.countDocuments({ parentId: comment._id }),
          ])

          return {
            ...comment,
            id: comment._id.toString(),
            author: comment.authorId,
            replies: [],
            _count: {
              likes: likeCount,
              replies: replyCount,
            },
          }
        })
      )

      return enriched
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}

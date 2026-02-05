import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Comment from '@/models/Comment'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '5'), 1), 20)

    if (!parentId) {
      return NextResponse.json({ error: 'parentId is required' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const pid = new mongoose.Types.ObjectId(parentId)
      const Like = (await import('@/models/Like')).default

      const [total, replies] = await Promise.all([
        Comment.countDocuments({ parentId: pid }),
        Comment.find({ parentId: pid })
          .populate('authorId', 'name image id')
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ])

      const enriched = await Promise.all(
        replies.map(async (r: any) => {
          const [likeCount, replyCount] = await Promise.all([
            Like.countDocuments({ commentId: r._id }),
            Comment.countDocuments({ parentId: r._id }),
          ])

          return {
            ...r,
            id: r._id.toString(),
            author: r.authorId,
            replies: [],
            _count: {
              likes: likeCount,
              replies: replyCount,
            },
          }
        })
      )

      return {
        replies: enriched,
        total,
        skip,
        limit,
        hasMore: skip + enriched.length < total,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching comment replies:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.FETCH_FAILED }, { status: 500 })
  }
}

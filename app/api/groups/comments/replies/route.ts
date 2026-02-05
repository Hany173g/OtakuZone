import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import GroupComment from '@/models/GroupComment'
import Like from '@/models/Like'
import { z } from 'zod'
import mongoose from 'mongoose'
import { translateZodError, ERROR_MESSAGES } from '@/lib/validation-ar'

const querySchema = z.object({
  parentId: z.string().min(1),
  skip: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(25).default(5),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const validated = querySchema.parse({
      parentId: searchParams.get('parentId'),
      skip: searchParams.get('skip') || '0',
      limit: searchParams.get('limit') || '5',
    })

    if (!mongoose.Types.ObjectId.isValid(validated.parentId)) {
      return NextResponse.json({ error: 'معرف التعليق غير صالح' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const parent = await GroupComment.findById(new mongoose.Types.ObjectId(validated.parentId))
        .select('_id')
        .lean()

      if (!parent) {
        return { ok: false as const, status: 404, error: 'التعليق غير موجود' }
      }

      const replies = await GroupComment.find({ parentId: new mongoose.Types.ObjectId(validated.parentId) })
        .populate('authorId', 'name image id')
        .sort({ createdAt: 1 })
        .skip(validated.skip)
        .limit(validated.limit)
        .lean()

      const enriched = await Promise.all(
        replies.map(async (r: any) => {
          const [likeCount, replyCount] = await Promise.all([
            Like.countDocuments({ groupCommentId: r._id }),
            GroupComment.countDocuments({ parentId: r._id }),
          ])

          return {
            ...r,
            id: r._id.toString(),
            author: r.authorId,
            replies: [],
            _count: { likes: likeCount, replies: replyCount },
          }
        })
      )

      return { ok: true as const, items: enriched }
    })

    if (!(result as any).ok) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json((result as any).items)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: translateZodError(error) }, { status: 400 })
    }
    console.error('Error fetching group comment replies:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.FETCH_FAILED }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import GroupTopic from '@/models/GroupTopic'
import GroupComment from '@/models/GroupComment'
import Like from '@/models/Like'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'
import { z } from 'zod'
import { translateZodError, ERROR_MESSAGES } from '@/lib/validation-ar'
import { bbcodeToHtml } from '@/lib/bbcode'

const createSchema = z.object({
  content: z.string().min(1, 'محتوى التعليق مطلوب'),
  groupTopicId: z.string().min(1, 'معرف المنشور مطلوب'),
  parentId: z.string().optional(),
})

async function canViewGroupTopic(opts: { sessionUserId?: string | null; groupTopicId: string }) {
  if (!mongoose.Types.ObjectId.isValid(opts.groupTopicId)) return { ok: false as const, status: 400, error: 'معرف المنشور غير صالح' }

  const topic = await GroupTopic.findById(new mongoose.Types.ObjectId(opts.groupTopicId))
    .select('groupId status')
    .lean()

  if (!topic || (topic as any).status !== 'published') {
    return { ok: false as const, status: 404, error: 'المنشور غير موجود' }
  }

  const group = await Group.findById((topic as any).groupId).select('isPublic').lean()
  if (!group) return { ok: false as const, status: 404, error: 'المجتمع غير موجود' }

  if ((group as any).isPublic) {
    return { ok: true as const, topic, group }
  }

  if (!opts.sessionUserId) {
    return { ok: false as const, status: 403, error: 'هذا المجتمع خاص. يلزم الانضمام لعرض المحتوى.' }
  }

  const membership = await GroupMember.findOne({
    groupId: (topic as any).groupId,
    userId: new mongoose.Types.ObjectId(opts.sessionUserId),
    status: 'active',
  })
    .select('_id')
    .lean()

  if (!membership) {
    return { ok: false as const, status: 403, error: 'هذا المجتمع خاص. يلزم الانضمام لعرض المحتوى.' }
  }

  return { ok: true as const, topic, group }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const groupTopicId = String(searchParams.get('groupTopicId') || '').trim()

    if (!groupTopicId) {
      return NextResponse.json({ error: 'groupTopicId is required' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const gate = await canViewGroupTopic({ sessionUserId: session?.id || null, groupTopicId })
      if (!gate.ok) return gate

      const mainComments = await GroupComment.find({
        groupTopicId: new mongoose.Types.ObjectId(groupTopicId),
        parentId: null,
      })
        .populate('authorId', 'name image id')
        .sort({ createdAt: 1 })
        .lean()

      const enriched = await Promise.all(
        mainComments.map(async (comment: any) => {
          const [likeCount, replyCount] = await Promise.all([
            Like.countDocuments({ groupCommentId: comment._id }),
            GroupComment.countDocuments({ parentId: comment._id }),
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

      return { ok: true as const, items: enriched }
    })

    if (!(result as any).ok) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json((result as any).items)
  } catch (error) {
    console.error('Error fetching group comments:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.FETCH_FAILED }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const validated = createSchema.parse(body)

    const created = await withDB(async () => {
      const gate = await canViewGroupTopic({ sessionUserId: session.id, groupTopicId: validated.groupTopicId })
      if (!gate.ok) return gate

      const newComment = await GroupComment.create({
        content: bbcodeToHtml(validated.content),
        groupTopicId: new mongoose.Types.ObjectId(validated.groupTopicId),
        authorId: new mongoose.Types.ObjectId(session.id),
        parentId: validated.parentId ? new mongoose.Types.ObjectId(validated.parentId) : null,
      })

      const populated = await GroupComment.findById(newComment._id)
        .populate('authorId', 'name image id')
        .lean()

      if (!populated) {
        return { ok: false as const, status: 500, error: ERROR_MESSAGES.CREATE_FAILED }
      }

      return {
        ok: true as const,
        item: {
          ...populated,
          id: (populated as any)._id.toString(),
          author: (populated as any).authorId,
          replies: [],
          _count: { likes: 0, replies: 0 },
        },
      }
    })

    if (!(created as any).ok) {
      return NextResponse.json({ error: (created as any).error }, { status: (created as any).status || 400 })
    }

    return NextResponse.json((created as any).item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: translateZodError(error) }, { status: 400 })
    }
    console.error('Error creating group comment:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.CREATE_FAILED }, { status: 500 })
  }
}

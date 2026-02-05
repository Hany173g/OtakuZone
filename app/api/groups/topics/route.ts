import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import GroupTopic from '@/models/GroupTopic'
import GroupComment from '@/models/GroupComment'
import GroupLog from '@/models/GroupLog'
import Category from '@/models/Category'
import Like from '@/models/Like'
import Dislike from '@/models/Dislike'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'
import crypto from 'crypto'
import { bbcodeToHtml } from '@/lib/bbcode'
import { isSupportedVideoUrl } from '@/lib/video'

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id)
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function slugify(input: string) {
  const cleaned = String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

  return cleaned
}

async function getMembershipRole(groupId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const m = await GroupMember.findOne({ groupId, userId, status: 'active' }).select('role').lean()
  return m?.role || null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    const { searchParams } = new URL(request.url)
    const groupIdRaw = String(searchParams.get('groupId') || '').trim()
    const statusRaw = String(searchParams.get('status') || 'published').trim()
    const search = String(searchParams.get('search') || '').trim()

    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), 25)

    if (!groupIdRaw || !mongoose.Types.ObjectId.isValid(groupIdRaw)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const groupId = toObjectId(groupIdRaw)

      const group = await Group.findById(groupId)
        .select('isPublic settings')
        .lean()

      if (!group) return { error: 'المجتمع غير موجود', status: 404 as const }

      let role: string | null = null
      if (session?.id) {
        role = await getMembershipRole(groupId, toObjectId(session.id))
      }

      const canViewPrivate = !!role
      if (!(group as any).isPublic && !canViewPrivate) {
        return { error: 'هذا المجتمع خاص. يلزم الانضمام لعرض المحتوى.', status: 403 as const }
      }

      const status = statusRaw === 'pending' || statusRaw === 'rejected' ? statusRaw : 'published'

      if (status !== 'published') {
        if (role !== 'admin' && role !== 'moderator') {
          return { error: 'غير مصرح', status: 403 as const }
        }
      }

      const query: any = { groupId, status }

      if (search) {
        const r = new RegExp(escapeRegex(search), 'i')
        query.$or = [{ title: r }, { content: r }]
      }

      const [total, items] = await Promise.all([
        GroupTopic.countDocuments(query),
        GroupTopic.find(query)
          .populate('authorId', 'name image')
          .populate('categoryId')
          .sort({ isPinned: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ])

      const enriched = await Promise.all(
        items.map(async (t: any) => {
          const commentCount = await GroupComment.countDocuments({ groupTopicId: t._id })
          const likeCount = await Like.countDocuments({ groupTopicId: t._id })
          const dislikeCount = await Dislike.countDocuments({ groupTopicId: t._id })

          const author = t.isAnonymous
            ? { name: t.anonymousName || 'مجهول', image: null }
            : (t.authorId || null)

          return {
            ...t,
            id: t._id.toString(),
            author,
            _count: { comments: commentCount, likes: likeCount, dislikes: dislikeCount },
          }
        })
      )

      return {
        items: enriched,
        total,
        skip,
        limit,
        hasMore: skip + enriched.length < total,
        nextSkip: skip + enriched.length,
      }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching group topics:', error)
    return NextResponse.json({ error: 'تعذر تحميل منشورات المجتمع' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const groupIdRaw = String(body?.groupId || '').trim()
    const title = String(body?.title || '').trim()
    const content = String(body?.content || '').trim()
    const type = String(body?.type || '').trim()
    const categoryIdRaw = String(body?.categoryId || '').trim()
    const imageUrl = String(body?.imageUrl || '').trim()
    const videoUrl = String(body?.videoUrl || '').trim()
    const isAnonymous = Boolean(body?.isAnonymous)
    const anonymousName = String(body?.anonymousName || '').trim()

    if (imageUrl && videoUrl) {
      return NextResponse.json({ error: 'لا يمكن الجمع بين صورة وفيديو في نفس المنشور' }, { status: 400 })
    }

    if (!groupIdRaw || !mongoose.Types.ObjectId.isValid(groupIdRaw)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    if (title.length < 3 || title.length > 200) {
      return NextResponse.json({ error: 'العنوان يجب أن يكون بين 3 و 200 حرف' }, { status: 400 })
    }

    if (content.length < 10) {
      return NextResponse.json({ error: 'المحتوى يجب أن يكون على الأقل 10 أحرف' }, { status: 400 })
    }

    if (videoUrl && !isSupportedVideoUrl(videoUrl)) {
      return NextResponse.json({ error: 'رابط الفيديو غير صالح أو غير مدعوم' }, { status: 400 })
    }

    if (type !== 'anime' && type !== 'manga' && type !== 'manhwa') {
      return NextResponse.json({ error: 'يجب اختيار النوع (أنمي/مانجا/مانهوا)' }, { status: 400 })
    }

    if (!categoryIdRaw || !mongoose.Types.ObjectId.isValid(categoryIdRaw)) {
      return NextResponse.json({ error: 'التصنيف مطلوب' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const groupId = toObjectId(groupIdRaw)
      const userId = toObjectId(session.id)
      const categoryId = toObjectId(categoryIdRaw)

      const group = await Group.findById(groupId)
        .select('isPublic settings')
        .lean()

      if (!group) return { error: 'المجتمع غير موجود', status: 404 as const }

      const category = await Category.findById(categoryId).select('_id').lean()
      if (!category) {
        return { error: 'التصنيف غير موجود', status: 400 as const }
      }

      const role = await getMembershipRole(groupId, userId)
      if (!role) {
        return { error: 'يلزم الانضمام للمجتمع قبل النشر', status: 403 as const }
      }

      const allowAnonymous = Boolean((group as any)?.settings?.allowAnonymousPosts)
      if (isAnonymous && !allowAnonymous) {
        return { error: 'النشر المجهول غير مفعّل في هذا المجتمع', status: 400 as const }
      }

      const requiresApproval = Boolean((group as any)?.settings?.postApprovalRequired)
      const status: 'pending' | 'published' = requiresApproval && role !== 'admin' && role !== 'moderator' ? 'pending' : 'published'

      const base = slugify(title) || 'post'

      let slug = ''
      for (let i = 0; i < 10; i++) {
        const suffix = crypto.randomBytes(4).toString('hex').slice(0, 6)
        slug = `${base}-${suffix}`
        const exists = await GroupTopic.findOne({ slug }).select('_id').lean()
        if (!exists) break
      }

      const created = await GroupTopic.create({
        title,
        content: bbcodeToHtml(content),
        slug,
        type: type as any,
        groupId,
        authorId: userId,
        categoryId,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        isAnonymous: isAnonymous && allowAnonymous,
        anonymousName: isAnonymous && allowAnonymous && anonymousName ? anonymousName : undefined,
        status,
        approvedBy: status === 'published' ? userId : undefined,
        approvedAt: status === 'published' ? new Date() : undefined,
      })

      if (status === 'published') {
        await Group.updateOne({ _id: groupId }, { $inc: { topicCount: 1 } })
      }

      await GroupLog.create({
        groupId,
        actorId: userId,
        action: status === 'published' ? 'group_post_published' : 'group_post_pending',
        targetTopicId: created._id,
      })

      return {
        item: {
          id: created._id.toString(),
          slug: created.slug,
          status: created.status,
        },
      }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating group topic:', error)
    return NextResponse.json({ error: 'تعذر إنشاء المنشور' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Follow from '@/models/Follow'
import Topic from '@/models/Topic'
import Notification from '@/models/Notification'
import User from '@/models/User'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')
    const userId = requestedUserId || session?.id || null
    const topicId = searchParams.get('topicId')

    if (session?.id && requestedUserId && String(requestedUserId) !== String(session.id)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    const follows = await withDB(async () => {
      const query: any = { userId: new mongoose.Types.ObjectId(userId) }
      if (topicId) query.topicId = new mongoose.Types.ObjectId(topicId)

      const found = await Follow.find(query)
        .populate({
          path: 'topicId',
          populate: [
            { path: 'authorId', select: 'name image' },
            { path: 'categoryId' },
          ],
        })
        .sort({ createdAt: -1 })
        .lean()

      return found.map((f: any) => ({
        id: f._id.toString(),
        topic: f.topicId
          ? {
              id: f.topicId._id.toString(),
              slug: f.topicId.slug,
              title: f.topicId.title,
              author: f.topicId.authorId,
              category: f.topicId.categoryId,
              createdAt: f.topicId.createdAt,
              views: f.topicId.views,
              isPinned: f.topicId.isPinned,
              isPopular: f.topicId.isPopular,
              isLocked: f.topicId.isLocked,
            }
          : null,
        createdAt: f.createdAt,
      }))
    })

    return NextResponse.json({ follows })
  } catch (error) {
    console.error('Error fetching follows:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topicId } = body

    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const userId = session.id

    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId is required' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const uid = new mongoose.Types.ObjectId(userId)
      const tid = new mongoose.Types.ObjectId(topicId)

      const existing = await Follow.findOne({ userId: uid, topicId: tid }).lean()
      if (existing) return { status: 200, following: true }

      const [topic, actor] = await Promise.all([
        Topic.findById(tid).lean(),
        User.findById(uid).lean(),
      ])

      if (topic && topic.authorId?.toString() === uid.toString()) {
        return { status: 400, following: false, error: 'لا يمكنك متابعة موضوعك' }
      }

      await Follow.create({ userId: uid, topicId: tid })

      if (topic && topic.authorId?.toString() !== userId) {
        await Notification.create({
          userId: topic.authorId,
          type: 'follow',
          message: `بدأ ${actor?.name || 'مستخدم'} متابعة موضوعك "${topic.title}"`,
          link: `/topic/${topic.slug}`,
          relatedUserId: uid,
          relatedTopicId: tid,
        })
      }

      return { status: 201, following: true }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json(result, { status: (result as any).status })
  } catch (error: any) {
    console.error('Error following topic:', error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'أنت تتابع هذا الموضوع بالفعل' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.CREATE_FAILED },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { topicId } = body

    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const userId = session.id

    if (!topicId) {
      return NextResponse.json(
        { error: 'معرف الموضوع مطلوب' },
        { status: 400 }
      )
    }

    await withDB(async () => {
      await Follow.deleteOne({
        userId: new mongoose.Types.ObjectId(userId),
        topicId: new mongoose.Types.ObjectId(topicId),
      })
    })

    return NextResponse.json({ following: false, message: 'تم إلغاء المتابعة بنجاح' })
  } catch (error) {
    console.error('Error unfollowing topic:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.DELETE_FAILED },
      { status: 500 }
    )
  }
}


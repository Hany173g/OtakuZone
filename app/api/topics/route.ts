import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Topic from '@/models/Topic'
import Category from '@/models/Category'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import User from '@/models/User'
import UserFollow from '@/models/UserFollow'
import Notification from '@/models/Notification'
import { z } from 'zod'
import mongoose from 'mongoose'
import { translateZodError, ERROR_MESSAGES } from '@/lib/validation-ar'
import { bbcodeToHtml } from '@/lib/bbcode'
import { emitToUser } from '@/lib/realtime'
import crypto from 'crypto'
import { isSupportedVideoUrl } from '@/lib/video'

const topicSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون على الأقل 3 أحرف').max(200, 'العنوان يجب أن يكون على الأكثر 200 حرف'),
  content: z.string().min(10, 'المحتوى يجب أن يكون على الأقل 10 أحرف'),
  type: z.enum(['anime', 'manga', 'manhwa'], { errorMap: () => ({ message: 'النوع يجب أن يكون: أنمي، مانجا، أو مانهوا' }) }),
  categoryId: z.string().min(1, 'التصنيف مطلوب'),
  authorId: z.string().min(1, 'معرف المؤلف مطلوب'),
  imageUrl: z.string().trim().max(2048, 'رابط الصورة طويل جداً').optional(),
  videoUrl: z
    .string()
    .trim()
    .max(2048, 'رابط الفيديو طويل جداً')
    .optional()
    .refine((val) => !val || isSupportedVideoUrl(val), {
      message: 'رابط الفيديو غير صالح أو غير مدعوم',
    }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (body && typeof body === 'object' && typeof body.videoUrl === 'string' && !body.videoUrl.trim()) {
      body.videoUrl = undefined
    }
    if (body && typeof body === 'object' && body.imageUrl && body.videoUrl) {
      return NextResponse.json({ error: 'لا يمكن الجمع بين صورة وفيديو في نفس المنشور' }, { status: 400 })
    }
    const validatedData = topicSchema.parse(body)
    console.log('[API DEBUG] validatedData.videoUrl:', validatedData.videoUrl)

    const topic = await withDB(async () => {
      const slugify = (input: string) => {
        const cleaned = input
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
          .replace(/-{2,}/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 80)

        return cleaned
      }

      const baseSlug = slugify(validatedData.title)
      const base = baseSlug || 'topic'

      let slug = ''
      for (let i = 0; i < 10; i++) {
        const suffix = crypto.randomBytes(4).toString('hex').slice(0, 6)
        slug = `${base}-${suffix}`
        const exists = await Topic.findOne({ slug }).select('_id').lean()
        if (!exists) break
      }

      const authorIdObj = new mongoose.Types.ObjectId(validatedData.authorId)
      console.log('[API DEBUG] Creating topic with videoUrl:', validatedData.videoUrl)
      const newTopic = await Topic.create({
        title: validatedData.title,
        content: bbcodeToHtml(validatedData.content),
        type: validatedData.type,
        slug,
        imageUrl: validatedData.imageUrl || undefined,
        videoUrl: validatedData.videoUrl || undefined,
        authorId: authorIdObj,
        categoryId: new mongoose.Types.ObjectId(validatedData.categoryId),
      })
      console.log('[API DEBUG] Created topic videoUrl:', (newTopic as any).videoUrl)

      const topic = await Topic.findById(newTopic._id)
        .populate('authorId', 'name image')
        .populate('categoryId')
        .lean()
      console.log('[API DEBUG] Fetched topic videoUrl:', (topic as any).videoUrl)

      try {
        const author = await User.findById(authorIdObj)
          .select('name profileVisibility')
          .lean()

        if (author) {
          const followers = await UserFollow.find({
            followingId: authorIdObj,
            notify: true,
          })
            .select('followerId')
            .lean()

          let recipientIds = followers.map((f: any) => String(f.followerId))

          if (author.profileVisibility !== 'public' && recipientIds.length > 0) {
            const mutual = await UserFollow.find({
              followerId: authorIdObj,
              followingId: { $in: recipientIds.map((id) => new mongoose.Types.ObjectId(id)) },
            })
              .select('followingId')
              .lean()

            const mutualSet = new Set(mutual.map((m: any) => String(m.followingId)))
            recipientIds = recipientIds.filter((id) => mutualSet.has(String(id)))
          }

          recipientIds = recipientIds.filter((id) => id !== String(authorIdObj))

          if (recipientIds.length > 0) {
            const message = `نشر ${author.name || 'مستخدم'} موضوعاً جديداً: "${validatedData.title}"`
            const link = `/topic/${slug}`

            const created = await Notification.insertMany(
              recipientIds.map((rid) => ({
                userId: new mongoose.Types.ObjectId(rid),
                type: 'new_topic',
                message,
                link,
                relatedUserId: authorIdObj,
                relatedTopicId: newTopic._id,
              }))
            )

            for (let i = 0; i < created.length; i++) {
              const n: any = created[i]
              const rid = recipientIds[i]
              emitToUser(rid, 'notification:new', {
                id: n._id.toString(),
                type: n.type,
                message: n.message,
                read: n.read,
                link: n.link,
                createdAt: n.createdAt,
              })
            }
          }
        }
      } catch {
        // ignore
      }

      return await Topic.findById(newTopic._id)
        .populate('authorId', 'name image')
        .populate('categoryId')
        .lean()
    })

    if (!topic) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CREATE_FAILED },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...topic,
      id: topic._id.toString(),
      slug: topic.slug,
      videoUrl: (topic as any).videoUrl,
      imageUrl: (topic as any).imageUrl,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: translateZodError(error) },
        { status: 400 }
      )
    }
    console.error('Error creating topic:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.CREATE_FAILED },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const filter = searchParams.get('filter')
    const limit = parseInt(searchParams.get('limit') || '20')

    const topics = await withDB(async () => {
      let query: any = {}

      if (category) {
        const categoryDoc = await Category.findOne({ slug: category })
        if (categoryDoc) {
          query.categoryId = categoryDoc._id
        }
      }

      if (filter === 'popular') {
        query.isPopular = true
      }

      let sort: any = { createdAt: -1 }
      if (filter === 'popular') {
        sort = { views: -1 }
      }

      const topics = await Topic.find(query)
        .populate('authorId', 'name image')
        .populate('categoryId')
        .sort(sort)
        .limit(limit)
        .lean()

      // Add comment and like counts
      const topicsWithCounts = await Promise.all(
        topics.map(async (topic: any) => {
          const [commentCount, likeCount] = await Promise.all([
            Comment.countDocuments({ topicId: topic._id }),
            Like.countDocuments({ topicId: topic._id }),
          ])
          return {
            ...topic,
            _count: {
              comments: commentCount,
              likes: likeCount,
            },
          }
        })
      )

      return topicsWithCounts
    })

    return NextResponse.json(topics.map((t: any) => ({
      ...t,
      id: t._id.toString(),
    })))
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}


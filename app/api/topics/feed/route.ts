import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Topic from '@/models/Topic'
import Category from '@/models/Category'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import Dislike from '@/models/Dislike'
import type { PipelineStage } from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category')
    const filter = searchParams.get('filter')
    const type = searchParams.get('type')
    const sort = searchParams.get('sort') || 'new' // new, popular, trending

    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), 25)

    // Prevent negative skip (NoSQL injection prevention)
    if (skip < 0) {
      return NextResponse.json({ error: 'Invalid skip parameter' }, { status: 400 })
    }

    const result = await withDB(async () => {
      let query: any = {}

      if (type) {
        // Validate type to prevent injection
        const validTypes = ['anime', 'manga', 'manhwa']
        if (validTypes.includes(type)) {
          query.type = type
        }
      }

      if (category) {
        // Validate category is a valid string (XSS prevention)
        const sanitizedCategory = String(category).replace(/[<>\"']/g, '')
        const categoryDoc = await Category.findOne({ slug: sanitizedCategory }).select('_id').lean()
        if (categoryDoc) {
          query.categoryId = categoryDoc._id
        }
      }

      if (filter === 'popular') {
        query.isPopular = true
      } else if (filter === 'pinned') {
        query.isPinned = true
      }

      // Sorting options with engagement
      let sortQuery: any = { createdAt: -1 }
      if (sort === 'popular' || filter === 'popular') {
        sortQuery = { views: -1, createdAt: -1 }
      } else if (sort === 'trending') {
        // Trending: high engagement (views + likes + comments) in recent time
        sortQuery = { isPopular: -1, views: -1, createdAt: -1 }
      } else if (sort === 'most_liked') {
        // Will be handled by aggregation
      }

      // For most_liked, use aggregation to sort by like count
      let topics: any[] = []
      let total = 0

      if (sort === 'most_liked') {
        const pipeline: PipelineStage[] = [
          { $match: query },
          {
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'topicId',
              as: 'likes',
            },
          },
          {
            $addFields: {
              likeCount: { $size: '$likes' },
            },
          },
          { $sort: { likeCount: -1 as const, createdAt: -1 as const } },
          { $skip: skip },
          { $limit: limit },
        ]
        topics = await Topic.aggregate(pipeline)
        total = await Topic.countDocuments(query)
      } else {
        [total, topics] = await Promise.all([
          Topic.countDocuments(query),
          Topic.find(query)
            .populate('authorId', 'name image')
            .populate('categoryId')
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .lean(),
        ])
      }

      const enriched = await Promise.all(
        topics.map(async (topic: any) => {
          const [commentCount, likeCount, dislikeCount] = await Promise.all([
            Comment.countDocuments({ topicId: topic._id }),
            Like.countDocuments({ topicId: topic._id }),
            Dislike.countDocuments({ topicId: topic._id }),
          ])

          // Calculate engagement score (views + likes*2 + comments*3)
          const engagementScore = (topic.views || 0) + (likeCount * 2) + (commentCount * 3)

          return {
            ...topic,
            id: topic._id.toString(),
            author: topic.authorId,
            category: topic.categoryId,
            _count: {
              comments: commentCount,
              likes: likeCount,
              dislikes: dislikeCount,
            },
            engagementScore,
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

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching topics feed:', error)
    return NextResponse.json({ error: 'تعذر تحميل المواضيع' }, { status: 500 })
  }
}

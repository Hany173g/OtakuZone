import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import User from '@/models/User'
import Topic from '@/models/Topic'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import Rating from '@/models/Rating'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'activity' // activity, topics, comments, likes, ratings

    const topUsers = await withDB(async () => {
      // Get all users with their activity stats
      const users = await User.find({})
        .select('name image role createdAt')
        .lean()

      // Calculate stats for each user
      const usersWithStats = await Promise.all(
        users.map(async (user: any) => {
          const userId = user._id

          // Get counts in parallel
          const [topicsCount, commentsCount, likesReceived, ratingsCount] = await Promise.all([
            // Topics created by user
            Topic.countDocuments({ authorId: userId }),
            // Comments by user
            Comment.countDocuments({ authorId: userId }),
            // Likes received on user's topics and comments
            Promise.all([
              // Likes on user's topics
              Topic.find({ authorId: userId }).select('_id').lean().then(async (topics) => {
                const topicIds = topics.map((t: any) => t._id)
                if (topicIds.length === 0) return 0
                return Like.countDocuments({ topicId: { $in: topicIds } })
              }),
              // Likes on user's comments
              Comment.find({ authorId: userId }).select('_id').lean().then(async (comments) => {
                const commentIds = comments.map((c: any) => c._id)
                if (commentIds.length === 0) return 0
                return Like.countDocuments({ commentId: { $in: commentIds } })
              }),
            ]).then(([topicLikes, commentLikes]) => topicLikes + commentLikes),
            // Ratings by user
            Rating.countDocuments({ userId }),
          ])

          // Calculate activity score (weighted)
          // Topics: 10 points each
          // Comments: 2 points each
          // Likes received: 1 point each
          // Ratings: 5 points each
          const activityScore = 
            (topicsCount * 10) + 
            (commentsCount * 2) + 
            (likesReceived * 1) + 
            (ratingsCount * 5)

          return {
            ...user,
            id: user._id.toString(),
            stats: {
              topics: topicsCount,
              comments: commentsCount,
              likesReceived,
              ratings: ratingsCount,
              activityScore,
            },
          }
        })
      )

      // Sort users based on sortBy parameter
      let sortedUsers = usersWithStats
      switch (sortBy) {
        case 'topics':
          sortedUsers = usersWithStats.sort((a, b) => b.stats.topics - a.stats.topics)
          break
        case 'comments':
          sortedUsers = usersWithStats.sort((a, b) => b.stats.comments - a.stats.comments)
          break
        case 'likes':
          sortedUsers = usersWithStats.sort((a, b) => b.stats.likesReceived - a.stats.likesReceived)
          break
        case 'ratings':
          sortedUsers = usersWithStats.sort((a, b) => b.stats.ratings - a.stats.ratings)
          break
        case 'activity':
        default:
          sortedUsers = usersWithStats.sort((a, b) => b.stats.activityScore - a.stats.activityScore)
          break
      }

      // Filter out users with 0 activity and limit results
      return sortedUsers
        .filter((user) => user.stats.activityScore > 0)
        .slice(0, limit)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
        }))
    })

    return NextResponse.json({ users: topUsers })
  } catch (error) {
    console.error('Error fetching top users:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}


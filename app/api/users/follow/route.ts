import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import UserFollow from '@/models/UserFollow'
import Notification from '@/models/Notification'
import User from '@/models/User'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'
import { getSession } from '@/lib/auth'
import { emitToUser } from '@/lib/realtime'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { followingId } = body

    if (!followingId) {
      return NextResponse.json(
        { error: 'معرف المستخدم المتابوع مطلوب' },
        { status: 400 }
      )
    }

    if (session.id === followingId) {
      return NextResponse.json(
        { error: 'لا يمكنك متابعة نفسك' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const followerId = new mongoose.Types.ObjectId(session.id)
      const followingIdObj = new mongoose.Types.ObjectId(followingId)

      // Check if already following
      const existing = await UserFollow.findOne({
        followerId,
        followingId: followingIdObj,
      }).lean()

      if (existing) {
        return { following: true, message: 'أنت تتابع هذا المستخدم بالفعل' }
      }

      // Create follow relationship
      await UserFollow.create({
        followerId,
        followingId: followingIdObj,
        notify: false,
      })

      // Get users info
      const [follower, following] = await Promise.all([
        User.findById(followerId).lean(),
        User.findById(followingIdObj).lean(),
      ])

      // Check if mutual follow (friends) - if the followed user also follows back
      const isMutualFollow = await UserFollow.findOne({
        followerId: followingIdObj,
        followingId: followerId,
      }).lean()

      // Create notification for the followed user (always)
      if (following) {
        const n = await Notification.create({
          userId: followingIdObj,
          type: 'user_follow',
          message: `بدأ ${follower?.name || 'مستخدم'} متابعتك`,
          link: `/profile/${followerId}`,
          relatedUserId: followerId,
        })

        emitToUser(followingIdObj.toString(), 'notification:new', {
          id: n._id.toString(),
          type: n.type,
          message: n.message,
          read: n.read,
          link: n.link,
          createdAt: n.createdAt,
        })
      }

      // If mutual follow (friends), send notification to the follower too
      if (isMutualFollow && follower) {
        const n2 = await Notification.create({
          userId: followerId,
          type: 'user_follow_back',
          message: `${following?.name || 'مستخدم'} بدأ متابعتك أيضاً - أنتما الآن أصدقاء`,
          link: `/profile/${followingIdObj}`,
          relatedUserId: followingIdObj,
        })

        emitToUser(followerId.toString(), 'notification:new', {
          id: n2._id.toString(),
          type: n2.type,
          message: n2.message,
          read: n2.read,
          link: n2.link,
          createdAt: n2.createdAt,
        })
      }

      return { following: true, message: 'تمت المتابعة بنجاح', isMutualFollow: !!isMutualFollow }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error following user:', error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'أنت تتابع هذا المستخدم بالفعل' },
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
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const followingId = searchParams.get('followingId')

    if (!followingId) {
      return NextResponse.json(
        { error: 'معرف المستخدم المتابوع مطلوب' },
        { status: 400 }
      )
    }

    await withDB(async () => {
      await UserFollow.deleteOne({
        followerId: new mongoose.Types.ObjectId(session.id),
        followingId: new mongoose.Types.ObjectId(followingId),
      })
    })

    return NextResponse.json({ following: false, message: 'تم إلغاء المتابعة بنجاح' })
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.DELETE_FAILED },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'followers' or 'following'
    const followingId = searchParams.get('followingId')

    // Status mode: return whether current logged-in user follows `followingId`
    if (followingId) {
      if (!session?.id) {
        return NextResponse.json({ following: false, notify: false, isMutualFollow: false })
      }

      const result = await withDB(async () => {
        const followerId = new mongoose.Types.ObjectId(session.id)
        const followingIdObj = new mongoose.Types.ObjectId(followingId)

        const existing = await UserFollow.findOne({ followerId, followingId: followingIdObj }).lean()
        const isMutualFollow = existing
          ? await UserFollow.findOne({ followerId: followingIdObj, followingId: followerId }).select('_id').lean()
          : null

        return {
          following: !!existing,
          notify: !!(existing as any)?.notify,
          isMutualFollow: !!isMutualFollow,
        }
      })

      return NextResponse.json(result)
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    const result = await withDB(async () => {
      const userIdObj = new mongoose.Types.ObjectId(userId)

      if (type === 'followers') {
        // Get users who follow this user
        const follows = await UserFollow.find({ followingId: userIdObj })
          .populate('followerId', 'name email image')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean()

        return {
          users: follows.map((f: any) => ({
            ...f.followerId,
            id: f.followerId._id.toString(),
            followedAt: f.createdAt,
          })),
        }
      } else {
        // Get users that this user follows
        const follows = await UserFollow.find({ followerId: userIdObj })
          .populate('followingId', 'name email image')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean()

        return {
          users: follows.map((f: any) => ({
            ...f.followingId,
            id: f.followingId._id.toString(),
            followedAt: f.createdAt,
          })),
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching follows:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json()
    const { followingId, notify } = body

    if (!followingId || typeof notify !== 'boolean') {
      return NextResponse.json({ error: 'followingId و notify مطلوبان' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const followerId = new mongoose.Types.ObjectId(session.id)
      const followingIdObj = new mongoose.Types.ObjectId(followingId)

      const updated = await UserFollow.findOneAndUpdate(
        { followerId, followingId: followingIdObj },
        { $set: { notify } },
        { new: true }
      ).lean()

      if (!updated) {
        return { error: 'يجب متابعة المستخدم أولاً', status: 404 as const }
      }

      return { notify: !!(updated as any).notify }
    })

    if ((result as any).error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating follow notify:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.UPDATE_FAILED }, { status: 500 })
  }
}


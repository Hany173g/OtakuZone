import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Notification from '@/models/Notification'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    const { notifications, unreadCount } = await withDB(async () => {
      const uid = new mongoose.Types.ObjectId(userId)
      const query: any = { userId: uid }
      if (unreadOnly) query.read = false

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()

      const unreadCount = await Notification.countDocuments({ userId: uid, read: false })

      return {
        notifications: notifications.map((n: any) => ({
          ...n,
          id: n._id.toString(),
          _id: n._id.toString(),
        })),
        unreadCount,
      }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, message, link, relatedUserId, relatedTopicId, relatedCommentId } = body

    const notification = await withDB(async () => {
      return await Notification.create({
        userId: new mongoose.Types.ObjectId(userId),
        type,
        message,
        link,
        relatedUserId: relatedUserId ? new mongoose.Types.ObjectId(relatedUserId) : undefined,
        relatedTopicId: relatedTopicId ? new mongoose.Types.ObjectId(relatedTopicId) : undefined,
        relatedCommentId: relatedCommentId ? new mongoose.Types.ObjectId(relatedCommentId) : undefined,
      })
    })

    return NextResponse.json({
      ...notification.toObject(),
      id: notification._id.toString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.CREATE_FAILED },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, userId } = body

    if (notificationId) {
      // Mark single notification as read
      const notification = await withDB(async () => {
        return await Notification.findByIdAndUpdate(
          new mongoose.Types.ObjectId(notificationId),
          { $set: { read: true } },
          { new: true }
        ).lean()
      })
      return NextResponse.json(notification)
    } else if (userId) {
      // Mark all notifications as read
      await withDB(async () => {
        await Notification.updateMany(
          { userId: new mongoose.Types.ObjectId(userId), read: false },
          { $set: { read: true } }
        )
      })
      return NextResponse.json({ message: 'تم تحديد جميع الإشعارات كمقروءة' })
    }

    return NextResponse.json(
      { error: 'معرف الإشعار أو معرف المستخدم مطلوب' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UPDATE_FAILED },
      { status: 500 }
    )
  }
}

